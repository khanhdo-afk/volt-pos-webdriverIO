/**
 * WDIO service for the PRODUCTION lane.
 *
 * Unlike AppLifecycleService (dev/staging), it owns nothing: it never kills,
 * relaunches, resets or reinstalls the app. It only checks that the installed
 * production till is up with CDP on REMOTE_DEBUG_PORT and that msedgedriver is
 * listening, starting the driver alone if needed.
 */
import fs from 'node:fs';
import { Paths } from '../../configs/constants/paths.js';
import { loadEnv } from '../../configs/env/loadEnv.js';
import { ensureAttachDriver } from '../support/attachApp.js';
import { assertLane } from './policy.js';

export default class ProductionAttachService {
  async beforeSession(): Promise<void> {
    assertLane();
    const env = loadEnv();
    const url = `http://127.0.0.1:${String(env.REMOTE_DEBUG_PORT)}/json/version`;
    const ok = await fetch(url, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) {
      throw new Error(
        `Production lane: no Volt POS listening on CDP ${String(env.REMOTE_DEBUG_PORT)}. ` +
          'Start the installed production app with `npm run prod:app` (it is never auto-launched here).',
      );
    }
    await ensureAttachDriver();
    for (const dir of [Paths.SCREENSHOTS, Paths.ALLURE_RESULTS]) fs.mkdirSync(dir, { recursive: true });
  }
}
