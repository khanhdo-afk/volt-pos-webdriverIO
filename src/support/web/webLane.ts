import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Paths } from '../../../configs/constants/paths.js';
import type { AppointmentHandoff, AppointmentInput } from '../../pages/web/OrderSitePage.js';
import type { CheckinHandoff, CheckinInput } from '../../pages/web/CheckinKioskPage.js';
import { CHECKIN_BULK_FILE, CHECKIN_HANDOFF_FILE } from '../../pages/web/checkinHandoff.js';
import { HANDOFF_FILE } from '../../pages/web/handoff.js';
import { moduleLogger } from '../../utils/logger.js';

const log = moduleLogger('web-lane');

/** One web action (GAP kiosk / GoCheckin web) — login + wizard — must finish within this. */
const WEB_ACTION_TIMEOUT = Number(process.env.WEB_ACTION_TIMEOUT ?? 360_000);

/** Inside a web-lane spec: the input the app-lane caller passed (empty = spec defaults). */
export function webInput<T>(): T {
  const raw = process.env.WEB_INPUT;
  return (raw ? JSON.parse(raw) : {}) as T;
}

/**
 * Run one web-lane spec (Edge + msedgedriver, its own wdio process) from INSIDE an
 * app-lane test and return what it wrote to `outFile`.
 *
 * The app lane owns the single Volt POS WebDriver session, so GoCheckin / GAP are
 * driven by the already-proven web-lane page objects in a child wdio run — the app
 * session stays open and the very next POS step sees the result. Same Edge
 * profiles, same `WEB_*` credentials as `npm run web:*`.
 */
export async function runWebSpec<T>(
  spec: string,
  input: unknown,
  outFile: string,
  extraEnv: Record<string, string> = {},
  timeoutMs: number = WEB_ACTION_TIMEOUT,
): Promise<T> {
  fs.rmSync(outFile, { force: true });
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['wdio', 'run', 'configs/wdio/wdio.web.conf.ts', '--spec', spec];
  const logFile = path.join(Paths.TMP, `web-lane-${path.basename(spec, '.spec.ts')}.log`);
  fs.mkdirSync(Paths.TMP, { recursive: true });
  const out = fs.createWriteStream(logFile);
  log.info(`web lane → ${spec} ${JSON.stringify(input)}`);

  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: Paths.ROOT,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ENV: process.env.ENV ?? 'dev',
        WEB_INPUT: JSON.stringify(input ?? {}),
        SPEC_RETRIES: '0',
        ...extraEnv,
        // The parent's worker/runner variables must not leak into the child run.
        WDIO_WORKER_ID: '',
      },
    });
    child.stdout.pipe(out);
    child.stderr.pipe(out);
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(`web lane ${spec} did not finish within ${String(timeoutMs / 1000)}s (log: ${logFile})`),
      );
    }, timeoutMs);
    child.on('exit', (c) => {
      clearTimeout(timer);
      resolve(c ?? 1);
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });

  if (code !== 0 || !fs.existsSync(outFile)) {
    const tail = fs.existsSync(logFile)
      ? fs
          .readFileSync(logFile, 'utf8')
          .split(/\r?\n/)
          .filter((l) => /FAIL|Error|error:/.test(l))
          .slice(-6)
          .join('\n')
      : '';
    throw new Error(`web lane ${spec} failed (exit ${String(code)}). Log: ${logFile}\n${tail}`);
  }
  return JSON.parse(fs.readFileSync(outFile, 'utf8')) as T;
}

/** Check a customer in on the GAP → GoCheckin kiosk (a pending order syncs to POS). */
export function gapCheckin(input: CheckinInput = {}): Promise<CheckinHandoff> {
  return runWebSpec<CheckinHandoff>('tests/web/create-checkin.spec.ts', input, CHECKIN_HANDOFF_FILE);
}

/** Book an appointment on the GoCheckin web POS (pos.gocheckin.net); it syncs to the POS board. */
export function goCheckinAppointment(input: AppointmentInput = {}): Promise<AppointmentHandoff> {
  return runWebSpec<AppointmentHandoff>('tests/web/create-appointment.spec.ts', input, HANDOFF_FILE);
}

const ageMin = (label?: string): number =>
  label ? (Date.now() - new Date(label).getTime()) / 60_000 : Number.POSITIVE_INFINITY;

/**
 * The newest GAP kiosk check-in, made NOW (in this run) when the handoff file is
 * missing or older than `maxAgeMin` — app specs no longer skip for "run web:checkin first".
 */
export async function freshCheckin(maxAgeMin = 60): Promise<CheckinHandoff> {
  const cur = readJson<CheckinHandoff>(CHECKIN_HANDOFF_FILE);
  if (cur && ageMin(cur.createdAtLabel) <= maxAgeMin) return cur;
  return gapCheckin();
}

/** Same for a GoCheckin web appointment (`npm run web:appointment`). */
export async function freshAppointment(maxAgeMin = 60): Promise<AppointmentHandoff> {
  const cur = readJson<AppointmentHandoff>(HANDOFF_FILE);
  if (cur && ageMin(cur.createdAtLabel) <= maxAgeMin) return cur;
  return goCheckinAppointment();
}

const isToday = (label?: string): boolean =>
  !!label && new Date(label).toDateString() === new Date().toDateString();

/**
 * A GAP-kiosk BULK batch of at least `min` check-ins made TODAY (Pending Orders lists
 * today's check-ins only). A batch from an earlier day or a short one is replaced by a
 * new one (`tests/web/create-checkin-bulk.spec.ts`, ~1 min per check-in).
 */
export async function freshCheckinBulk(min: number): Promise<CheckinHandoff[]> {
  const cur = readJson<CheckinHandoff[]>(CHECKIN_BULK_FILE) ?? [];
  if (cur.length >= min && isToday(cur[0]?.createdAtLabel)) return cur;
  const reset = !isToday(cur[0]?.createdAtLabel);
  log.info(
    `bulk check-ins: have ${String(cur.length)}${reset ? ' (stale)' : ''}, making ${String(min)} today`,
  );
  if (reset) fs.rmSync(CHECKIN_BULK_FILE, { force: true });
  const spawnOut = path.join(Paths.TMP, 'web-checkin-bulk.done.json');
  fs.writeFileSync(spawnOut, '{}');
  await runWebSpec<unknown>(
    'tests/web/create-checkin-bulk.spec.ts',
    {},
    spawnOut,
    { CHECKIN_BULK: '1', CHECKIN_COUNT: String(min), MOCHA_TIMEOUT: String(min * 180_000) },
    min * 180_000,
  ).catch((e: Error) => {
    // runWebSpec deletes outFile first; the batch file itself is the real result.
    if ((readJson<CheckinHandoff[]>(CHECKIN_BULK_FILE) ?? []).length < min) throw e;
  });
  return readJson<CheckinHandoff[]>(CHECKIN_BULK_FILE) ?? [];
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}
