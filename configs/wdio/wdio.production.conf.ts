import fs from 'node:fs';
import path from 'node:path';
import FeatureResultReporter from '../reporters/FeatureResultReporter.js';
import { Paths } from '../constants/paths.js';
import { loadEnv } from '../env/loadEnv.js';
import ProductionAttachService from '../../src/features/ProductionAttachService.js';
import { assertLane } from '../../src/features/policy.js';
import { shared } from './wdio.shared.conf.js';

const env = loadEnv();

/**
 * PRODUCTION lane — profile `production` (configs/profiles), store 20258 on the
 * live backend. Runs the shared feature specs (tests/features/**) with the
 * production profile + safety layer:
 *   - attach only (ProductionAttachService never launches/kills/resets/updates);
 *   - own root hooks (tests/features/setup/prodHooks.ts);
 *   - writes = cash/Other/gift-card on cheap services (ALLOW_PROD_WRITES set by
 *     `npm run test:production`); Card TCs SKIP unless the run confirmed gateway +
 *     real money (src/features/policy.ts).
 */
const profile = assertLane();
if (profile.target !== 'production') throw new Error('wdio.production.conf.ts needs TARGET=production.');
if (env.MODE !== 'attach') throw new Error('The production lane only attaches (WDIO_MODE=attach).');

const feat = (...p: string[]): string => path.join(Paths.TESTS, 'features', ...p);

// One id per run, inherited by every worker (results + discovered store data are keyed by it).
process.env.FEATURE_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, '-');

/** One suite per project folder (+ preflight), so new folders need no config change. */
const folderSuites = Object.fromEntries(
  fs
    .readdirSync(feat())
    .filter((d) => d !== 'setup' && fs.statSync(feat(d)).isDirectory())
    .map((d) => [d, [feat('00-preflight.spec.ts'), feat(d, '**', '*.spec.ts')]]),
);

export const config: WebdriverIO.Config = {
  ...shared,
  specs: [feat('**', '*.spec.ts')],
  exclude: [],
  suites: {
    ...folderSuites,
    /** Everything except Card (the default `test:production` run). */
    noCard: [
      feat('00-preflight.spec.ts'),
      ...Object.keys(folderSuites)
        .filter((d) => d !== 'zz-card')
        .map((d) => feat(d, '**', '*.spec.ts')),
    ],
    maintenance: [feat('00-preflight.spec.ts'), feat('maintenance-m11-w1', '*.spec.ts')],
    reopen: [feat('00-preflight.spec.ts'), feat('reopen-order', '*.spec.ts')],
    darkMode: [feat('00-preflight.spec.ts'), feat('dark-mode', '*.spec.ts')],
    /** Every Card TC, grouped and run last; SKIPPED unless the run confirmed gateway + real money. */
    card: [feat('00-preflight.spec.ts'), feat('zz-card', '*.spec.ts')],
  },
  capabilities: [
    {
      browserName: 'MicrosoftEdge',
      'ms:edgeOptions': { debuggerAddress: `127.0.0.1:${String(env.REMOTE_DEBUG_PORT)}` },
      // Classic WebDriver only: the BiDi mapper injects a tab into the app and
      // knocks the customer display onto about:blank, after which it no longer
      // receives the tip / payment events from the staff window.
      'wdio:enforceWebDriverClassic': true,
    },
  ],
  services: [[ProductionAttachService, {}]],
  reporters: [...(shared.reporters ?? []), [FeatureResultReporter, {}]],
  specFileRetries: profile.retries,
  bail: 0,
  mochaOpts: {
    ...shared.mochaOpts,
    timeout: 300_000,
    require: [feat('setup', 'prodHooks.ts')],
  },
};
