/**
 * volt-qc 02 HOME / 06 PEND — cases that cannot be automated on this POS lane.
 *
 * TC catalogue: docs/qc/volt-qc/windows-regression/02-home-tao-order.md and
 * 06-pending-checkin.md. Every `it.skip` below is a MANUAL test case kept here so
 * the coverage report (`npx tsx scripts/volt-qc-coverage.ts`) counts it as manual
 * rather than missing. The comment above each one says why: it needs a second
 * POS, the GoCheckin kiosk, the customer display driven as a second window, a
 * printer / scanner, a network cut, Portal data changes, a store-wide setting or
 * language switch that would break the other lanes sharing this till, or data
 * the suite cannot create on its own.
 *
 * Automated HOME / PEND cases live in tests/regression/volt-qc/home-pend/*.spec.ts
 * (WRITE) and tests/regression/volt-qc/pos/{home,pending}.spec.ts (read-only).
 */

describe('volt-qc 02 HOME — manual cases', () => {
  /* --------------------------- Screen / runtime ------------------------ */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // WebDriver on the Tauri window has no device-metrics override (CDP emulation in the source); resize the window by hand.
  // it.skip(
  //   title(
  //     '[MANUAL] At 1920×1080 the Pending Orders sidebar becomes a drawer with no horizontal scroll (HOME-004)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs the WebView devtools console across a background sync — WebDriver cannot read the Tauri console.
  // it.skip(
  //   title(
  //     '[MANUAL] After a sync, Home actions (line x) still work and the console shows no repeated "Invalid hook call" (HOME-005)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs observing the OS: whether a modified click spawns the external browser.
  // it.skip(
  //   title(
  //     '[MANUAL] Shift / Ctrl + click on an in-app link does not open the external browser (VP-3926) (HOME-177)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Second POS ----------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a second POS (or P8D) on the same merchant holding the order.
  // it.skip(
  //   title(
  //     '[MANUAL] An order open on another device shows "In Use · <device>" and cannot be opened (HOME-012)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a second POS to time the claim release.
  // it.skip(
  //   title(
  //     '[MANUAL] Leaving /home releases the claim; the other device opens the order within 3 s (HOME-013)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Portal data / settings ------------------ */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a staff added / edited on Portal or GAP, then a sync.
  // it.skip(
  //   title('[MANUAL] A staff created on Portal / GAP shows on the POS after sync (HOME-018)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs Turn Count data: clock-ins and finished turns for several staff today.
  // it.skip(
  //   title(
  //     '[MANUAL] Sort "Turn Count": clocked-in staff first, fewest turns on top (HOME-026)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs several staff with appointments booked later today.
  // it.skip(
  //   title(
  //     '[MANUAL] Sort "Appointment Time" orders staff by their next appointment today (HOME-027)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a service set Inactive on Portal (and its name).
  // it.skip(title('[MANUAL] An Inactive service is not offered on Home (HOME-045)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs the service order arranged on Portal to compare with.
  // it.skip(
  //   title(
  //     '[MANUAL] Services in a category follow the order the merchant set on Portal (HOME-046)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a staff set Inactive on Portal while sitting in an open order.
  // it.skip(
  //   title(
  //     '[MANUAL] A staff made Inactive while in an order raises "Remove Inactive Staff" (HOME-083)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Customer display ----------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // The Customer Note popup fires on the CUSTOMER's phone confirmation (customer:phoneConfirmed) — the second window is not drivable in this lane.
  // it.skip(
  //   title(
  //     '[MANUAL] A customer with a Customer Note gets the read-only "Customer Note" popup each time they are picked (HOME-105)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- GoCheckin / appointments ---------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a GoCheckin check-in for the customer (kiosk on another surface).
  // it.skip(
  //   title(
  //     '[MANUAL] Picking a customer with a pending check-in order opens that order instead of a new one (HOME-115)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Production-only observation (VP-3314 dialog absent on prod) — the suite never runs writes on prod.
  // it.skip(
  //   title(
  //     '[MANUAL] Production has no "Customer information matches an existing pending order…" Link / Create Separately dialog (HOME-116)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a booked appointment for today checked out from the board (appointment data owned by the 08 lane).
  // it.skip(
  //   title(
  //     '[MANUAL] Checking out an appointment while an order is open asks first; Cancel keeps the current order (HOME-118)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs an appointment result in header Search (booked for today).
  // it.skip(
  //   title(
  //     "[MANUAL] Clicking an appointment result in Search opens today's calendar (HOME-160)",
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Notifications come from booking-site appointment events.
  // it.skip(
  //   title('[MANUAL] The bell shows a badge and opens the notification popover (HOME-164)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a merchant with no notifications at all (shared till always has some).
  // it.skip(title('[MANUAL] No notifications → empty state (HOME-165)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs unread notifications generated by the booking site.
  // it.skip(title('[MANUAL] "Mark all as read" clears the unread state (HOME-166)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs appointments in each status to produce each notification text.
  // it.skip(
  //   title('[MANUAL] Notification text follows the appointment status (HOME-167)', Tag.REGRESSION),
  //   () => {},
  // );
  /* --------------------------- Shared-till state ----------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a till with NO other mergeable pending order — impossible to guarantee on the shared dev merchant.
  // it.skip(
  //   title(
  //     '[MANUAL] Merge Order with no other mergeable order shows the empty state (HOME-129)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a partial (split) payment, which locks the split screen on dev until every check is paid — it wedges the shared till.
  // it.skip(
  //   title(
  //     '[MANUAL] An order that already has a payment cannot be removed, only sent to Order History (HOME-154)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Hardware ------------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs the receipt printer.
  // it.skip(
  //   title('[MANUAL] Print the pre-bill (ticket preview) of an unpaid order (HOME-141)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs the printer and a QR scanner.
  // it.skip(
  //   title(
  //     '[MANUAL] Pre-bill carries QR ORDER:<orderCode> with Display QR on; scanning it opens that pending order (HOME-142)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Multi-touch on the on-screen keyboard — WebDriver sends one pointer at a time.
  // it.skip(
  //   title(
  //     '[MANUAL] Several keys pressed at once on the virtual keyboard keep it open (HOME-172)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Language ------------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // App language is a device-wide switch; flipping it mid-run breaks every English-label lane on this till.
  // it.skip(
  //   title(
  //     '[MANUAL] In Vietnamese, Home shows no English (Quick Pay, service count, Unknown, Merge Order) (HOME-173)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // App language switch (see HOME-173).
  // it.skip(
  //   title(
  //     '[MANUAL] In Vietnamese, the Search modal translates title, placeholder, hint and the 4 tabs (HOME-174)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // App language switch + a check-in / booking to show in the customer popup.
  // it.skip(
  //   title(
  //     '[MANUAL] In Vietnamese, check-in status, booking time and date in the customer popup follow the VI locale (HOME-175)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
});

describe('volt-qc 06 PEND — manual cases', () => {
  /* --------------------------- Second POS / Portal -------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a second POS (or GoCheckin) creating the order while this page is open.
  // it.skip(
  //   title(
  //     '[MANUAL] An order created elsewhere appears on /order-pending within seconds, no reload (PEND-023)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Second device holding the order.
  // it.skip(
  //   title('[MANUAL] An order open on another device shows "In Use · <device>" (PEND-031)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Second device holding the order.
  // it.skip(
  //   title('[MANUAL] Tapping an order held by another device is blocked (PEND-032)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Second device releasing the order.
  // it.skip(
  //   title(
  //     '[MANUAL] When device B leaves the order the "In Use" pill on A disappears (PEND-033)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Two devices with a stale copy.
  // it.skip(
  //   title(
  //     '[MANUAL] Device A completed the order; device B tapping its stale copy still sees Successful (PEND-034)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Second device + Portal.
  // it.skip(
  //   title(
  //     '[MANUAL] An order created on this device shows on the other device and on Portal (PEND-091)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- GoCheckin kiosk ------------------------ */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk (separate web surface, volt-qc `gci` fixture) creates the check-in order.
  // it.skip(
  //   title('[MANUAL] A check-in order card carries the full check-in information (PEND-024)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin check-in, then pay it.
  // it.skip(
  //   title(
  //     '[MANUAL] Completing a check-in order keeps the Checkin Today count and marks it Completed (PEND-044)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A returning customer with full details checks in → exactly 1 pending order, Checkin Today +1 (PEND-045)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] Customer missing email / birthday skips those steps and still makes exactly 1 order (PEND-046)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk (consent signature).
  // it.skip(
  //   title(
  //     '[MANUAL] A customer who never signed consent signs first, then the order is created (PEND-047)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A new number: name, consent, new customer and exactly 1 pending order (PEND-048)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk name field.
  // it.skip(
  //   title('[MANUAL] The GoCheckin new-customer name refuses digits (PEND-049)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A number already checked in and not checked out is blocked; no new order (PEND-050)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] Abandoning at the signature page then checking in again leaves exactly 1 order (PEND-051)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title('[MANUAL] Abandoning midway without redoing creates no order (PEND-052)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk, 8 check-ins.
  // it.skip(
  //   title(
  //     '[MANUAL] Checking in 5 existing + 3 new numbers creates exactly 8 orders (PEND-053)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk, repeated check-ins.
  // it.skip(
  //   title('[MANUAL] Every check-in reaches the POS; none dropped at random (PEND-054)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk timing.
  // it.skip(
  //   title('[MANUAL] A check-in order reaches the POS within seconds (PEND-055)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A checked-in customer appears in Pending Orders, not only in Checkin Today (PEND-056)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title("[MANUAL] Checkout shows the checked-in customer's name, not Unknown (PEND-057)", Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] Searching a checked-in customer by phone on Home opens their check-in order, no second order (PEND-058)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk + same phone on Home.
  // it.skip(
  //   title(
  //     '[MANUAL] The Link / Create Separately prompt for a pending order with the same phone (PEND-059)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk + two orders of one customer.
  // it.skip(
  //   title(
  //     '[MANUAL] Two pending orders of one customer: completing one leaves the other untouched (PEND-060)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A checked-in customer paid through another order links the check-in, no sync error (PEND-061)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk, several check-ins.
  // it.skip(
  //   title(
  //     '[MANUAL] Checking out one checked-in customer does not drop the other check-ins (PEND-062)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title('[MANUAL] A check-in shown in Pending stays on the order into checkout (PEND-063)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title('[MANUAL] A paid check-in order keeps its customer in Order History (PEND-064)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin kiosk.
  // it.skip(
  //   title(
  //     '[MANUAL] A check-in order opens empty, with the customer, waiting for staff / service (PEND-065)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // GoCheckin QR ticket (GBK) needs the kiosk camera / scanner.
  // it.skip(
  //   title('[MANUAL] A QR (GBK ticket) check-in on GoCheckin reaches the POS (PEND-066)', Tag.REGRESSION),
  //   () => {},
  // );
  /* --------------------------- Customer display ----------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // The customer types on the customer display — second window not drivable here.
  // it.skip(
  //   title(
  //     '[MANUAL] A known phone typed on the customer display attaches to the order (PEND-067)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Customer display.
  // it.skip(
  //   title(
  //     '[MANUAL] "No, enter again" on the customer display lets the customer type another number (PEND-068)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Customer display.
  // it.skip(
  //   title(
  //     '[MANUAL] A new number typed on the customer display opens quick-add on the POS without hanging (PEND-069)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Customer display.
  // it.skip(
  //   title(
  //     '[MANUAL] The customer confirming their number does not lose the order on the POS (PEND-070)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Customer display.
  // it.skip(
  //   title(
  //     '[MANUAL] A different number on the customer display detaches the previous customer (PEND-071)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Data the suite cannot create ------------ */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a pending order created YESTERDAY by the suite itself (it cannot back-date one; paying someone else's is off limits).
  // it.skip(
  //   title(
  //     "[MANUAL] Yesterday's pending order can be paid today; the order date becomes the completion date (PEND-075)",
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a booked appointment checked out twice from the board (appointment data owned by the 08 lane).
  // it.skip(
  //   title(
  //     '[MANUAL] Checking out an appointment creates a pending order; checking out again reopens the same one (PEND-079)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Report rows land asynchronously (report lag of minutes) across 3 report screens owned by the reports lane.
  // it.skip(
  //   title(
  //     '[MANUAL] An unpaid pending order is not counted in Daily Sale, Income Summary or Staff Income (PEND-098)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Report lag across 3 report screens (see PEND-098).
  // it.skip(
  //   title(
  //     '[MANUAL] Completing a pending order moves it to Order History and counts it once in all 3 reports (PEND-099)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a partial (split) payment, which locks the split screen on dev until every check is paid — it wedges the shared till.
  // it.skip(
  //   title(
  //     '[MANUAL] An order with a payment has no Remove, only Cancel Order → Order History (PEND-086)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Network cut while Other is selected.
  // it.skip(
  //   title(
  //     '[MANUAL] Network lost while on Other shows "Disconnected" and offers Cash (PEND-088)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Language ------------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // App language switch (device-wide).
  // it.skip(
  //   title(
  //     '[MANUAL] Vietnamese: Unknown → "Không xác định" and the labels are translated (PEND-092)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // App language switch + a completed check-in.
  // it.skip(
  //   title(
  //     '[MANUAL] Vietnamese: check-in status Completed / Finished is translated (PEND-093)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
});
