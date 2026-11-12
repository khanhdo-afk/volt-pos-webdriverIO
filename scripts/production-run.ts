/**
 * `npm run test:production [-- --store 2949] [--suite reopen-order] [--card-only] [--no-ask]`
 *
 * One button for the production lane, on ANY store (default 20258):
 *   1. runs every feature spec (Card TCs included — they SKIP as "PENDING Card");
 *   2. at the END asks the operator: "Có thẻ charge tiền thật không?" (terminal on the
 *      production gateway + a real card on the reader, ≤ $0.50 per charge).
 *      Yes → re-runs ONLY the grouped Card TCs (tests/features/zz-card) with the
 *      real-money flags; their results replace the PENDING skips. No → stop.
 *   3. prints the final PASS / FAIL / SKIP table (SKIP = Card + data gaps).
 *
 * The app must already be running with CDP (npm run prod:app) and be signed in to
 * the chosen store — the root hook refuses to test any other store. Read-only
 * stores (configs/profiles/production.<store>.json "readOnly": true, e.g. 2949)
 * only run the TCs that change nothing. Non-interactive runs never charge.
 */
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const argv = process.argv.slice(2);
const arg = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (name: string): boolean => argv.includes(`--${name}`);

const store = (arg('store') ?? process.env.STORE_ID ?? '20258').trim();
const suite = arg('suite');
const runId = process.env.FEATURE_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, '-');

const baseEnv: NodeJS.ProcessEnv = {
  ...process.env,
  ENV: 'prod',
  TARGET: 'production',
  STORE_ID: store,
  MERCHANT_ID: process.env.MERCHANT_ID ?? store,
  WDIO_MODE: 'attach',
  ALLOW_PROD_WRITES: 'i-know-what-i-am-doing',
  FEATURE_RUN_ID: runId,
  // Card stays PENDING unless step 2 is confirmed.
  PROD_CARD_GATEWAY: '',
  PROD_CARD_REAL_MONEY: '',
};

function wdio(env: NodeJS.ProcessEnv, suiteName?: string): number {
  const args = [
    'wdio',
    'run',
    'configs/wdio/wdio.production.conf.ts',
    ...(suiteName ? ['--suite', suiteName] : []),
  ];
  const r = spawnSync('npx', args, { stdio: 'inherit', shell: true, env });
  return r.status ?? 1;
}

async function askCard(): Promise<boolean> {
  if (!process.stdin.isTTY || flag('no-ask')) {
    console.log(
      '\n[card] Không hỏi được (không có terminal) → KHÔNG charge. Các TC Card giữ SKIP (PENDING).',
    );
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const yes = async (q: string): Promise<boolean> =>
    ['y', 'yes', 'c', 'co', 'có'].includes((await rl.question(`${q} (y/N): `)).trim().toLowerCase());
  console.log(
    `\n=== Thanh toán CARD trên PRODUCTION tiệm ${store} — charge TIỀN THẬT, tối đa $0.50/giao dịch ===`,
  );
  const ok =
    (await yes(
      'Có thẻ charge tiền thật không? (terminal đã kết nối cổng production, thẻ thật đặt trên đầu đọc)',
    )) && (await yes('Xác nhận lần nữa: cho phép charge tiền thật ≤ $0.50 mỗi giao dịch?'));
  rl.close();
  return ok;
}

async function main(): Promise<void> {
  console.log(`[production] store ${store} · run ${runId}`);
  let status = 0;
  if (!flag('card-only')) status = wdio(baseEnv, suite);

  if (!suite || suite === 'zz-card' || flag('card-only')) {
    if (await askCard()) {
      const s = wdio(
        { ...baseEnv, PROD_CARD_GATEWAY: 'connected', PROD_CARD_REAL_MONEY: 'confirmed' },
        'zz-card',
      );
      status = status || s;
    } else {
      console.log('[card] Không có thẻ / chưa đồng ý → bỏ qua, TC Card tính là SKIP.');
    }
  }

  spawnSync('npx', ['tsx', 'scripts/production-summary.ts', '--run', runId], {
    stdio: 'inherit',
    shell: true,
    env: baseEnv,
  });
  process.exit(status);
}

void main();
