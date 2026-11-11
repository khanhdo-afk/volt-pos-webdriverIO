import path from 'node:path';
import { Paths } from '../constants/paths.js';
import FeatureResultReporter from '../reporters/FeatureResultReporter.js';
import { assertLane } from '../../src/features/policy.js';
import { shared } from './wdio.shared.conf.js';

/**
 * STAGING lane — profile `staging` (configs/profiles): backend
 * https://volt-pos.v2.dev-fastboypay.com (internal ENV=dev), stores 14 / 100004.
 *
 * Runs the regression suite plus the shared feature specs (tests/features/**),
 * which read the staging store's data and allow everything (card included).
 * Stops at the first failure — it is the release gate.
 */
const profile = assertLane();
if (profile.target !== 'staging') throw new Error('wdio.staging.conf.ts needs TARGET=staging.');
process.env.FEATURE_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, '-');
const sharedRequire = (shared.mochaOpts as { require?: string[] } | undefined)?.require ?? [];

export const config: WebdriverIO.Config = {
  ...shared,
  bail: 1,
  specs: [
    path.join(Paths.TESTS, 'regression', '**', '*.spec.ts'),
    path.join(Paths.TESTS, 'features', '**', '*.spec.ts'),
  ],
  suites: {
    ...shared.suites,
    features: [path.join(Paths.TESTS, 'features', '**', '*.spec.ts')],
  },
  reporters: [...(shared.reporters ?? []), [FeatureResultReporter, {}]],
  mochaOpts: {
    ...shared.mochaOpts,
    // Feature specs need the store check + data discovery of the profile hooks.
    require: [...sharedRequire, path.join(Paths.TESTS, 'features', 'setup', 'prodHooks.ts')],
  },
  exclude: [
    ...(process.env.SKIP_MANUAL === '1'
      ? [path.join(Paths.TESTS, 'regression', 'volt-qc', '_manual', '*.spec.ts')]
      : []),
  ],
};
