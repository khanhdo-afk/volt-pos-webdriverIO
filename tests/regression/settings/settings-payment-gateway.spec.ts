/**
 * Payment Gateway (`/settings/payment-gateway`) — the "Charge directly via
 * Fastboy Payment gateway" switch.
 *
 * Covers TC-PGW-01..11 from
 * docs/screens/settings-payment-gateway/settings-payment-gateway-test-cases.md.
 *
 * ## Why every TC is pending on build 1.1.56
 *
 * The 2026-10-25 live dump of installed build 1.1.56 (merchant 14, DEV) shows:
 *
 * - no "Payment Gateway" entry in the settings sidebar (Tipping Settings, Charge
 *   & Fee, Receipt are the whole Payment & Receipt group), and
 * - the path itself rendering the settings shell plus "Not Found".
 *
 * Suites never navigate by URL (`docs/writing-tests.md` → Flows), so the screen
 * is unreachable and none of its eleven cases can run. One probe (not a doc TC)
 * pins that fact: it FAILS the day the sidebar offers the screen again, which is
 * the signal to replace the pending titles with real tests —
 * `src/pages/settings/PaymentGatewayPage.ts` already carries every method they
 * need (switch state, label click, Save absence, tauri-store read-back).
 *
 * Data note for whoever un-pends this: the switch writes immediately (no Save)
 * to the DEVICE-scoped tauri store, so restore it to ON in an `after` hook.
 */

import { expect } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { goToSettings } from '../../../src/flows/index.js';
import paymentGatewayPage from '../../../src/pages/settings/PaymentGatewayPage.js';
import { Tag, title } from '../../../src/types/testTags.js';

// const PENDING = 'PENDING (no sidebar entry; route renders "Not Found" on build 1.1.56)';

describe('Settings — Payment Gateway', () => {
  before(async function (this: Mocha.Context): Promise<void> {
    this.timeout(Timeouts.MOCHA_HOOK);
    await goToSettings();
  });

  it(
    title('Probe: the settings sidebar offers no Payment Gateway entry on this build', Tag.REGRESSION),
    async () => {
      // Flip to real coverage when this fails — see the file note.
      expect(await paymentGatewayPage.isSidebarEntryShown()).toBe(false);
    },
  );

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Screen renders its heading and description (TC-PGW-01) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`No passcode gate on entry (TC-PGW-02) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`The switch has the right accessible name and id (TC-PGW-03) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`The switch defaults to ON (TC-PGW-04) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Turning it off applies at once, no Save on screen (TC-PGW-05) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Turning it off shows no success toast (TC-PGW-06) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`The value is written to the tauri store (TC-PGW-07) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`OFF survives a reload (TC-PGW-08) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Turning it back on stores ON (TC-PGW-09) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Clicking the label toggles the switch (TC-PGW-10) — ${PENDING}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Cleanup: the switch is restored to ON (TC-PGW-11) — ${PENDING}`));
});
