/**
 * volt-qc 03 PAY — cases that cannot be automated on this POS lane.
 *
 * TC catalogue: docs/qc/volt-qc/windows-regression/03-checkout-thanh-toan.md.
 * Every `it.skip` below is a MANUAL test case kept here so the coverage report
 * (`npx tsx scripts/volt-qc-coverage.ts`) counts it as manual rather than
 * missing. The comment above each one says why it is manual: it needs a payment
 * terminal, a printer / cash drawer / scanner, a network cut, a second POS, a
 * Portal configuration change, or a store-wide setting that would break the
 * other lanes sharing this till.
 *
 * Automated PAY cases live in tests/regression/volt-qc/pay/*.spec.ts.
 */

describe('volt-qc 03 PAY — manual cases', () => {
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Network cut right after Complete Payment.
  // it.skip(
  //   title(
  //     '[MANUAL] Network lost right after Complete Payment (Other) does not duplicate the transaction on retry (PAY-162)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Network cut during a card charge + terminal.
  // it.skip(
  //   title(
  //     '[MANUAL] Network lost during a card charge: retry online detects the existing charge and blocks Back (PAY-163)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------------- Second POS ----------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a second POS on the same merchant.
  // it.skip(
  //   title(
  //     '[MANUAL] An order paid on another device while this one sits on checkout is not charged twice (PAY-164)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a second POS holding the order.
  // it.skip(
  //   title('[MANUAL] An order held by another device cannot be opened for payment (PAY-165)', Tag.REGRESSION),
  //   () => {},
  // );
  /* ----------------------- Payment terminal (card) -------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs an interrupted card completion on a real terminal (not prod-safe).
  // it.skip(
  //   title(
  //     '[MANUAL] An order already fully charged after an interrupted completion shows Complete Done (PAY-054)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal decline.
  // it.skip(
  //   title('[MANUAL] A declined card shows an error and leaves the order unpaid (PAY-140)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal decline → retry.
  // it.skip(
  //   title(
  //     '[MANUAL] Decline → Try Again → approved counts one successful transaction (PAY-141)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal timeout.
  // it.skip(
  //   title('[MANUAL] Timeout then retry does not create a second charge (PAY-142)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal: close the Present Card / error popup with X.
  // it.skip(
  //   title(
  //     '[MANUAL] Closing the card error popup with X cancels the terminal session (PAY-143)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal unplugged near the timeout.
  // it.skip(
  //   title(
  //     '[MANUAL] Terminal disconnected near timeout leaves POS and gateway in sync (PAY-144)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal + killing the app mid-charge.
  // it.skip(
  //   title(
  //     '[MANUAL] App killed while waiting for the card leaves no "Card – Processing" transaction (PAY-145)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Terminal, 60–90 s idle charge.
  // it.skip(
  //   title(
  //     '[MANUAL] A charge after 60–90 s with no gateway transaction is still approved (PAY-146)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Gateway double-charge response needs a real terminal + gateway.
  // it.skip(
  //   title(
  //     '[MANUAL] "Recently charged" gateway reply shows the Possible Double Charge popup (PAY-148)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Gateway "unknown" outcome needs network fault injection + terminal.
  // it.skip(
  //   title(
  //     '[MANUAL] An "unknown" result after 5 polls shows as Declined with Try Again (PAY-149)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* --------------------- Printer / drawer / scanner ------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Hardware: barcode scanner.
  // it.skip(
  //   title(
  //     '[MANUAL] Scanning a gift card with the scanner works every time, second order included (PAY-050)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Hardware: receipt printer.
  // it.skip(
  //   title('[MANUAL] Print in receipt then moves on like No Receipt (PAY-120)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Hardware: receipt printer + auto-print setting.
  // it.skip(
  //   title(
  //     '[MANUAL] Auto-print on completion prints on arrival and hides Print on the customer display (PAY-127)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Hardware: cash drawer.
  // it.skip(
  //   title('[MANUAL] Cash Drawer asks for the passcode then opens the drawer (PAY-132)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Printer/drawer state must be verified physically (a connected printer changes the outcome).
  // it.skip(
  //   title(
  //     '[MANUAL] Completing Cash with no printer still succeeds and only reports the drawer error (PAY-136)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* ------------------------ Receipt delivery -------------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Sends a real SMS (not prod-safe); delivery is verified on a phone.
  // it.skip(title('[MANUAL] Sending the receipt by SMS succeeds (PAY-123)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Sends a real e-mail; delivery is verified in a mailbox.
  // it.skip(title('[MANUAL] Sending the receipt by Email succeeds (PAY-125)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Sends a real SMS from the customer display.
  // it.skip(
  //   title(
  //     '[MANUAL] The customer types their own phone for the receipt on the display (PAY-126)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* -------------------- Portal / store configuration ------------------ */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Re-open Edit Order is locked on build 1.1.56 + needs a fee config.
  // it.skip(
  //   title(
  //     '[MANUAL] Re-open a Cash order, add a service, pay Cash: no SF, correct tax (PAY-094)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Re-open Edit Order is locked on build 1.1.56 + needs SF 5% / tax 10%.
  // it.skip(
  //   title(
  //     '[MANUAL] Re-open Cash (2×$100) + $100, switch to Card ⇒ Enter Amount $115.50 (PAY-095)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Portal: Product Tax + a "Supply Sale" product.
  // it.skip(
  //   title('[MANUAL] Product Tax applies to products, Supply Sale included (PAY-097)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Portal: Service Tax + Product Tax both set.
  // it.skip(
  //   title(
  //     '[MANUAL] Service Tax + Product Tax merge into one Tax row on checkout and customer display (PAY-098)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Sign-out / sign-in is a QR login on this device.
  // it.skip(
  //   title('[MANUAL] Tax still applies after sign-out / sign-in and after sync (PAY-102)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a Store-only line beside the staff block + Remove Staff; the Remove Staff flow has no reliable hooks on 1.1.x.
  // it.skip(
  //   title(
  //     '[MANUAL] Removing every staff from a tipped order warns "Tip Not Available" and drops the tip (PAY-064)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Tip Settings type Amount (store-wide).
  // it.skip(
  //   title(
  //     '[MANUAL] Tip type Amount shows fixed-amount presets and no "Tip based on total" (PAY-072)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  /* ------------------- Roles / passcode gates (shared) ---------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a staff code whose role lacks "Completed Payment".
  // it.skip(
  //   title('[MANUAL] A role without Completed Payment is refused at the passcode (PAY-110)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Turning the Complete Order gate off changes the shared till for every lane.
  // it.skip(
  //   title('[MANUAL] With the Complete Order gate off no passcode is asked (PAY-114)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a staff code whose role lacks "Open Cash Drawer".
  // it.skip(title('[MANUAL] A role without Open Cash Drawer is refused (PAY-134)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Turning the Open Cash Drawer gate off changes the shared till.
  // it.skip(
  //   title(
  //     '[MANUAL] With the Open Cash Drawer gate off the drawer opens without a passcode (PAY-135)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a staff code whose role lacks "Cancel Order".
  // it.skip(
  //   title('[MANUAL] A role without Cancel Order (Void) cannot void (PAY-157)', Tag.REGRESSION),
  //   () => {},
  // );
  /* ------------------------- Re-open with edits ----------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Re-open Edit Order (items/prices) is locked on build 1.1.56 — no money change can be made.
  // it.skip(
  //   title(
  //     '[MANUAL] Re-open + edit a paid order: checkout requires voiding the old transactions first (PAY-154)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same lock: the Void Order Transactions dialog never appears.
  // it.skip(
  //   title('[MANUAL] Void All voids every transaction after confirmation (PAY-155)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same lock.
  // it.skip(
  //   title('[MANUAL] Back to Order closes the void dialog without voiding (PAY-156)', Tag.REGRESSION),
  //   () => {},
  // );
  /* ---------------------- Language / display size --------------------- */
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Switching the till to Vietnamese is a device setting shared by every lane.
  // it.skip(title('[MANUAL] VI: the checkout header is fully translated (PAY-166)', Tag.REGRESSION), () => {});
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same device-language switch.
  // it.skip(
  //   title(
  //     '[MANUAL] VI: success-screen Cash line, Tip and receipt buttons are translated (PAY-167)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same device-language switch.
  // it.skip(
  //   title(
  //     '[MANUAL] VI: gift card insufficient-balance popup and block message are translated (PAY-168)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same device-language switch, on the customer display.
  // it.skip(
  //   title('[MANUAL] VI: the customer tip screen is fully translated (PAY-169)', Tag.REGRESSION),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Needs a physical 1920×1080 display (WebDriver cannot emulate device metrics on the Tauri window).
  // it.skip(
  //   title(
  //     '[MANUAL] At 1920×1080 every method shows Total Paid / Remaining / Change without scrolling (PAY-170)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same 1920×1080 display requirement.
  // it.skip(
  //   title(
  //     '[MANUAL] Total Paid / Change / Remaining labels are bold black, amounts keep their colour (PAY-171)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // // Same 1920 px display requirement.
  // it.skip(
  //   title(
  //     '[MANUAL] At 1920 px the success-screen tip line (staff + amount) fits on one line (PAY-172)',
  //     Tag.REGRESSION,
  //   ),
  //   () => {},
  // );
});
