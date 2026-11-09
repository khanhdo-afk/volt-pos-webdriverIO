/**
 * APPOINTMENT — tags, note, validation & save (VP-1615 Nhóm 4 + 5).
 *
 * Test cases: docs/screens/appointment/appointment-test-cases.md
 *   TC-TAG-01..07, TC-NOTE-01..05, TC-SAVE-01, TC-SAVE-01b, TC-SAVE-02..10 (23).
 *
 * Build 1.1.56 has NO create entry (dump 2026-10-25; P-VP-476 paused) — see
 * ./appointment.helpers.ts. Runtime-gated (SKIP on 1.1.56, run once the form
 * ships): TC-TAG-03, TC-NOTE-03, TC-SAVE-02 — they open the form and never save.
 * Everything that needs a SAVED appointment is PENDING: booking would have to
 * use the QA-SCAN-20261025 customer prefix and be cancelled in `after`, and
 * there is no form to book through on this build.
 *
 * Creates NOTHING.
 */

import { Timeouts } from '../../../configs/constants/timeouts.js';

import { returnToHome } from '../../../src/flows/index.js';
import { appointmentPage } from '../../../src/pages/index.js';

import { openOverview } from './appointment.helpers.js';

// const NO_FORM = NO_FORM_REASON;
// const BOOKS = 'would book a QA-SCAN-20261025 appointment + cancel it in after()';

describe('Appointment — tags, note, validation & save (VP-1615)', () => {
  before(async function (this: Mocha.Context): Promise<void> {
    this.timeout(Timeouts.MOCHA_HOOK);
    await openOverview();
  });

  beforeEach(async () => {
    await openOverview();
  });

  afterEach(async () => {
    await appointmentPage.closeDialog().catch(() => undefined);
  });

  after(async () => {
    await appointmentPage.closeDialog().catch(() => undefined);
    await returnToHome();
  });

  /* ------------------------------ Nhóm 4 — Tags ------------------------------ */

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Requested / Highlight / No-show each check independently (TC-TAG-01) — PENDING: ${NO_FORM}; tag checkbox markup never scanned`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`All three tags can be checked together (TC-TAG-02) — PENDING: ${NO_FORM}`));

  // [TẮT 2026-11-08] Form tạo/sửa lịch hẹn chưa có trên POS (P-VP-476 tạm dừng) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title('With the Repeat setting OFF, the create form has no Repeat tag (TC-TAG-03)', Tag.REGRESSION),
  //   async function (this: Mocha.Context) {
  //     // Precondition (doc): Repeat setting OFF — the default on the QA merchants.
  //     await requireCreateForm(this);
  //     expect(await appointmentPage.isRepeatTagShown()).toBe(false);
  //   },
  // );

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Repeat setting ON shows the Repeat tag + frequency + End date (TC-TAG-04) — PENDING: NEEDS CONFIRM; Repeat setting location/flag unknown + ${NO_FORM}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `The Repeat tag is hidden in the Edit flow (TC-TAG-05) — PENDING: ${NO_FORM}; needs a QA-SCAN-20261025 appointment to edit`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Cancelling a Repeat appointment cancels the whole series? (TC-TAG-06) — PENDING: NEEDS CONFIRM + Repeat setting + ${NO_FORM}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `A Highlight appointment shows the "H" badge on its card (TC-TAG-07) [VP-2371] — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );

  /* ------------------------------ Nhóm 4 — Note ------------------------------ */

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `A short note is saved and shown on detail, card and hover (TC-NOTE-01) — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`A 255-character note saves (TC-NOTE-02) — PENDING: ${NO_FORM}; ${BOOKS}`));

  // [TẮT 2026-11-08] Form tạo/sửa lịch hẹn chưa có trên POS (P-VP-476 tạm dừng) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title('A 256th note character is blocked or rejected (TC-NOTE-03)', Tag.REGRESSION),
  //   async function (this: Mocha.Context) {
  //     await requireCreateForm(this);
  //     await appointmentPage.typeNote('x'.repeat(APPOINTMENT_NOTE_MAX + 1));
  //     const length = (await appointmentPage.noteValue()).length;
  //     // Either mechanism satisfies the doc: input capped at 255, or a validation error.
  //     expect(length <= APPOINTMENT_NOTE_MAX || (await appointmentPage.isNoteTooLongErrorShown())).toBe(true);
  //   },
  // );

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Emoji / Vietnamese / <>&"' note saves and renders safely (TC-NOTE-04) — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Hovering a card shows its note (TC-NOTE-05) — PENDING: ${NO_FORM}; ${BOOKS}`));

  /* ------------------------------ Nhóm 5 — Validation & Save ------------------------------ */

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Happy path: toast, card on calendar, Confirmed, source POS, counts updated (TC-SAVE-01) [VP-2354] — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `The notification bell lists the new appointment (TC-SAVE-01b) [VP-2354] — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );

  // [TẮT 2026-11-08] Form tạo/sửa lịch hẹn chưa có trên POS (P-VP-476 tạm dừng) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title('Without a customer the appointment cannot be saved (TC-SAVE-02)', Tag.REGRESSION),
  //   async function (this: Mocha.Context) {
  //     await requireCreateForm(this);
  //     await appointmentPage.typeNote('QA-SCAN-20261025 missing customer');
  //     expect(await appointmentPage.isSaveEnabled()).toBe(false);
  //   },
  // );

  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Overlapping the same staff is warned/blocked (TC-SAVE-03) — PENDING: NEEDS CONFIRM (hard vs soft) + ${NO_FORM}; needs an overlapping fixture`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Outside business hours / Closed day is refused with the work-hours message (TC-SAVE-04) [VP-2344] — PENDING: ${NO_FORM}; needs a Closed-day fixture (@exclusive)`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Outside a staff's own booking hours is warned (TC-SAVE-05) — PENDING: ${NO_FORM}; needs per-staff hours fixture`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Warning popup "There are warnings…" + Accept — does it save? (TC-SAVE-06) — PENDING: NEEDS CONFIRM (high priority) + ${NO_FORM}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Hard error vs warning per cause (TC-SAVE-07) — PENDING: NEEDS CONFIRM + ${NO_FORM}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Duration 0 / past date-time are refused (TC-SAVE-08) [VP-2342, VP-2352] — PENDING: ${NO_FORM}`));
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title(
  //     `Appointment Overview counts go up by the booked lines (TC-SAVE-09) — PENDING: ${NO_FORM}; ${BOOKS}`,
  //   ),
  // );
  // [TẮT 2026-11-08] Test chưa hoàn thiện (PENDING — chỉ có tiêu đề) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(title(`Several lines with different staff save in one go (TC-SAVE-10) — PENDING: ${NO_FORM}; ${BOOKS}`));
});
