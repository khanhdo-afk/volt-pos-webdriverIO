/**
 * CD-038 — Show Point / Show Reward are ONE merchant setting shared by POS
 * (Settings › Accessibility › Customer display) and the Portal (Store Settings ›
 * Configuration › POS Accessibility). Was `[MANUAL]` (cd-e2e.manual) because it
 * needed the Portal open beside the till; {@link PortalStore} drives it in the same run.
 *
 * 1. POS flips Show Point and saves → the Portal shows the new value.
 * 2. The Portal flips it back and saves → POS reads it after sync.
 * The Portal value is snapshot before anything changes and restored in `after`.
 *
 * Store-wide → `@exclusive`. dev / staging only.
 */

import { expect } from '@wdio/globals';
import { Timeouts } from '../../../../configs/constants/timeouts.js';
import { assertWritesAllowed } from '../../../../configs/env/loadEnv.js';
import { returnToHome } from '../../../../src/flows/index.js';
import { readCustomerDisplay, setCustomerDisplay } from '../../../../src/pages/voltqc/cd-e2e/settingsCd.js';
import { PortalStore } from '../../../../src/support/portal/portalStore.js';
import { Tag, title } from '../../../../src/types/testTags.js';

const portal = new PortalStore();
const KEY = 'showPointsOnCustomerDisplay';

describe('volt-qc CD — Customer display settings, POS ↔ Portal', function () {
  this.timeout(Timeouts.MOCHA_TEST * 4);

  before(async function () {
    assertWritesAllowed('change the merchant customer-display setting');
    if (!(await portal.available())) this.skip(); // .portal-profile signed out → npm run portal:login
  });

  after(async () => {
    await returnToHome().catch(() => undefined);
    await portal.restore();
  });

  it(
    title(
      'Show Point / Show Reward saved on POS match Portal and Portal edits sync back (CD-038)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      const original = (await portal.read([KEY, 'showRewardsOnCustomerDisplay'], true)) as Record<
        string,
        boolean
      >;
      // A no-op ensure makes the session remember the original for restore().
      await portal.ensure({ [KEY]: original[KEY] as boolean });
      const pos = await readCustomerDisplay();
      expect(pos.showPoint).toBe(original[KEY]);
      expect(pos.showReward).toBe(original.showRewardsOnCustomerDisplay);

      // POS → Portal
      const flipped = !original[KEY];
      await setCustomerDisplay({ showPoint: flipped });
      await portal.waitPortalShows({ [KEY]: flipped });

      // Portal → POS
      await portal.ensure({ [KEY]: original[KEY] as boolean });
      expect((await readCustomerDisplay()).showPoint).toBe(original[KEY]);
    },
  );
});
