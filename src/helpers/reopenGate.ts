/**
 * Re-Open Order cases were parked on 04/11/2026 ("tạm không test theo yêu cầu").
 *
 * They stay skipped in ordinary runs, and come back on when the reopen suite runs with
 * `RUN_REOPEN=1` (`npm run test:reopen`), so a full re-test of Re-Open does not need
 * anyone to edit `.skip` by hand.
 */
export const reopenEnabled = process.env.RUN_REOPEN === '1';

export const describeReopen: Mocha.SuiteFunction | Mocha.PendingSuiteFunction = reopenEnabled
  ? describe
  : describe.skip;

export const itReopen: Mocha.TestFunction | Mocha.PendingTestFunction = reopenEnabled ? it : it.skip;
