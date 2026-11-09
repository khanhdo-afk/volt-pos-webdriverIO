---
title: Re-Open Order — bộ test tổng hợp (79 TC)
ticket: VP-2585
sub-issues: VP-3148, VP-3913, VP-3914, VP-3931, VP-3957, VP-3982, VP-4012, VP-4013, VP-4037, VP-4067, VP-4077, VP-4079, VP-4085, VP-4405, VP-4912, VP-4980, VP-5020, VP-5293, VP-5297
spec-files:
  - tests/regression/volt-qc/oh-reopen/reopen-core.spec.ts
  - tests/regression/volt-qc/oh-reopen/reopen-methods.spec.ts
  - tests/regression/volt-qc/oh-reopen/reopen-vq.spec.ts
  - tests/regression/volt-qc/pos/reopen.spec.ts
  - tests/regression/volt-qc/card-terminal/card-reopen.spec.ts
  - tests/regression/volt-qc/cd-e2e/e2e-reopen-split.spec.ts
  - tests/regression/order-flow/reopen-flow.spec.ts
  - tests/regression/order-flow/reopen-guards.spec.ts
  - tests/regression/order-flow/reopen.spec.ts
  - tests/regression/order-flow/vp-4912-reopen-split-close-ticket.spec.ts
  - tests/regression/order-flow/vp-5020-reopen-split-no-forced-void.spec.ts
  - tests/regression/order-flow/vp-5297-reopen-split-card-cash-subtotal.spec.ts
  - tests/regression/checkout-type/vp-4591-reopen-change-staff.spec.ts
  - tests/regression/checkout-type/vp-5293-reopen-recomplete-points.spec.ts
  - tests/regression/reopen/reopen-gaps.spec.ts
imported-at: 2026-11-09
updated-at: 2026-11-09
---

# Re-Open Order — bộ test tổng hợp

Nguồn: `reopen-order-test-cases.md` (20 task Linear reopen, QC Completed): 46 TC chính + 7 TC toggle gift-card SF + 26 regression = **79 TC**.

## Chạy cả bộ

```bash
APP_PATH="$LOCALAPPDATA\Volt POS\volt-pos.exe" npm run test:reopen
```

- Suite `reopen` (`configs/wdio/wdio.shared.conf.ts`) gom 15 spec ở trên.
- Các khối reopen bị tạm tắt từ 04/11/2026 dùng `describeReopen` / `itReopen` (`src/helpers/reopenGate.ts`).
  Chúng chỉ chạy khi `RUN_REOPEN=1`. `test:reopen` tự bật cờ này; các lượt chạy chung khác vẫn skip như cũ.
- Chạy 1 TC: `npx cross-env ENV=dev RUN_REOPEN=1 wdio run configs/wdio/wdio.dev.conf.ts --spec <file> --mochaOpts.grep "<mã TC>"`.

## Điều kiện chung

- POS Windows bản dev mới nhất, store 14, device đã đăng nhập; passcode staff `8888`.
- Fixture: `VOLT_TEST_STAFF[_2]`, `VOLT_TEST_SERVICE[_2]`, `VOLT_TEST_GIFT_CARD` (`configs/env/.env.dev`).
- Không có `VOLT_TEST_PRODUCT` → các case cần Product (RO-014/086) tự skip.
- Case Card cần máy quẹt thẻ (terminal) đang kết nối.

## Ký hiệu

✅ tự động · ⚠️ tự động một phần / có điều kiện · 🧱 chưa tự động được (lý do) · 📄 chỉ tài liệu.
Cột **Test phủ** ghi mã test (ID trong title) và file. Viết tắt file:
`core` = reopen-core · `methods` = reopen-methods · `vq` = reopen-vq · `pos` = volt-qc/pos/reopen ·
`card` = card-reopen · `e2e` = e2e-reopen-split · `flow` = reopen-flow · `4591` / `4912` / `5020` / `5293` / `5297` = spec VP tương ứng ·
`gaps` = reopen/reopen-gaps (viết mới 09/11).

## A. Checklist chính — 46 TC (VP-2585)

| TC   | Kịch bản                                         | Kỳ vọng                               | Test phủ                                               | Loại                                                 | Kết quả |
| ---- | ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- | ------- |
| TC01 | Đơn successful chưa settle → Reopen              | Đủ tính năng sửa tiền                 | core OH-156/RO-005, core "Add a service…", core RO-107 | ✅                                                   |         |
| TC02 | Đơn đã settled                                   | Không cho reopen                      | pos RO-100, RO-211; 5297 TC-VP5297-09                  | ✅                                                   |         |
| TC03 | Đơn split                                        | Chặn sửa tiền                         | vq RO-031; 4912 TC-VP4912-07                           | ✅                                                   |         |
| TC04 | Đơn có promotion/reward/campaign/custom-discount | Chặn sửa tiền                         | vq RO-030 (custom discount)                            | ⚠️ promotion/reward/campaign chưa có fixture         |         |
| TC05 | Đơn có cashback                                  | Chặn sửa tiền                         | —                                                      | 🧱 store 14 không bật cashback                       |         |
| TC06 | Hết lượt sửa                                     | Chỉ non-money, báo hết lượt           | flow RO-07, RO-08; vq RO-101                           | ✅                                                   |         |
| TC07 | Còn lượt sửa                                     | Báo còn lượt                          | flow RO-01/02; core OH-155/RO-001                      | ✅                                                   |         |
| TC08 | Sửa giá                                          | Chênh lệch đúng                       | core RO-107                                            | ✅                                                   |         |
| TC09 | Sửa item-discount                                | Tính đúng                             | vq RO-108                                              | ✅                                                   |         |
| TC10 | Thêm item mới                                    | taxPercent theo rate đã lưu của order | —                                                      | 🧱 cần đổi tax giữa lúc tạo đơn và reopen (Portal)   |         |
| TC11 | Xóa item                                         | Tính lại đúng                         | core OH-167/RO-020, RO-308                             | ✅                                                   |         |
| TC12 | Sửa/xóa/thêm gift card item                      | Bị chặn                               | vq RO-013/RO-032/RO-408                                | ⚠️ kiểm read-only; nút xóa/thêm GC chưa assert riêng |         |
| TC13 | Thêm staff                                       | Thành công                            | vq RO-042                                              | ✅                                                   |         |
| TC14 | Xóa staff                                        | Thành công                            | gaps TC-REOPEN-01                                      | ✅                                                   |         |
| TC15 | Gán lại item theo staff                          | Thành công                            | core RO-040                                            | ✅                                                   |         |
| TC16 | Thêm/xóa staff → tip chia lại                    | Σ tip share = tipAmount               | vq RO-042; core OH-161                                 | ✅                                                   |         |
| TC17 | Tăng tiền + đổi staff                            | Tip cũ không chia sai                 | gaps TC-REOPEN-02                                      | ✅                                                   |         |
| TC18 | Tăng tiền                                        | Charge newTotal − paid, txn mới       | core "Add a service…", RO-096                          | ✅                                                   |         |
| TC19 | Tăng tiền có tip                                 | totalTip = paidTip + tip mới          | vq RO-016                                              | ⚠️ kiểm base tip màn khách                           |         |
| TC20 | Tăng tiền                                        | SF/CD/tax theo rate đã lưu            | —                                                      | 🧱 cần đổi SF/CD/tax trên Portal                     |         |
| TC21 | Tăng tiền nhưng thuế giảm                        | Bắt buộc Void-All                     | vq RO-086                                              | ⚠️ cần `VOLT_TEST_PRODUCT`                           |         |
| TC22 | Charge thêm Card/Cash/GC/Other                   | Trả được                              | card RO-097/203; methods RO-403; core RO-084           | ✅                                                   |         |
| TC23 | Giảm tiền                                        | Void-all, trả lại từ đầu              | core OH-167, RO-308; card (drop service)               | ✅                                                   |         |
| TC24 | Có txn FAIL/PROCESSING                           | Chỉ void SUCCESS                      | —                                                      | 🧱 không tạo được txn FAIL/PROCESSING có chủ đích    |         |
| TC25 | Giảm tiền                                        | Tip về 0, nhập lại sạch               | gaps TC-REOPEN-03                                      | ✅                                                   |         |
| TC26 | Đơn trả gift card                                | Balance hoàn đúng                     | vq RO-094/RO-406                                       | ✅                                                   |         |
| TC27 | Tổng không đổi                                   | Không txn, không trừ lượt             | core OH-166/RO-004                                     | ✅                                                   |         |
| TC28 | Thoát bằng Done                                  | Không tốn lượt                        | flow RO-05; core OH-159                                | ✅                                                   |         |
| TC29 | Cancel Reopen                                    | Order giữ nguyên                      | core OH-155 (Cancel)                                   | ✅                                                   |         |
| TC30 | Đổi khách A → B                                  | Trừ A, cộng B                         | vq RO-052                                              | ✅                                                   |         |
| TC31 | Gán khách đơn walk-in                            | Điểm đúng                             | vq RO-051                                              | ✅                                                   |         |
| TC32 | Gỡ khách                                         | Thu hồi điểm                          | gaps TC-REOPEN-04                                      | ✅                                                   |         |
| TC33 | Tăng tiền có khách                               | Cộng phần chênh                       | vq RO-110                                              | ✅                                                   |         |
| TC34 | Void-All có khách                                | Trừ điểm cũ, tính lại                 | gaps TC-REOPEN-05                                      | ✅                                                   |         |
| TC35 | Complete có thanh toán                           | reopenEditCount +1                    | flow RO-07; core RO-084 (edit spent)                   | ✅                                                   |         |
| TC36 | Complete money-neutral                           | Không +1                              | core OH-166; flow RO-05                                | ✅                                                   |         |
| TC37 | Reopen sau khi hết lượt                          | Khóa sửa tiền                         | flow RO-08; vq RO-101                                  | ✅                                                   |         |
| TC38 | Offline, giảm tiền                               | Void local, sync sau                  | —                                                      | 🧱 không giả lập offline trong lane launch           |         |
| TC39 | Offline, tăng tiền                               | Chỉ Cash                              | —                                                      | 🧱 như TC38                                          |         |
| TC40 | Offline, tổng không đổi                          | Không phát sinh                       | —                                                      | 🧱 như TC38                                          |         |
| TC41 | Thoát khi chưa complete                          | Status Re-open, không crash           | flow RO-04; core OH-160; 4591 RO-M05                   | ✅                                                   |         |
| TC42 | Complete lại sau khi thoát                       | Trạng thái chuẩn hóa                  | core OH-160/RO-006; 4591 RO-M06; vq RO-412             | ✅                                                   |         |
| TC43 | Đơn app cũ chưa có taxPercent                    | Lấy rate hiện tại                     | —                                                      | 🧱 cần dữ liệu đơn cũ                                |         |
| TC44 | Đơn miễn thuế                                    | Vẫn miễn thuế                         | —                                                      | 🧱 store 14 không có item/đơn tax 0                  |         |
| TC45 | Charge thêm / void + bán lại                     | Income không tính đôi                 | vq RO-110/RO-312/RO-510 (Daily Sale 1 dòng)            | ✅                                                   |         |
| TC46 | Kỳ income-staff đã chốt                          | Không reopen được                     | core OH-175 (đơn ngày trước không có Re-Open)          | ⚠️ chỉ phủ phần "ngày trước"                         |         |

## B. Toggle gift-card service fee — 7 TC (VP-4077)

| TC  | Kịch bản            | Test phủ                                                | Loại                                                                    | Kết quả |
| --- | ------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| GC1 | ON/ON, sửa item     | —                                                       | 🧱 cần bật/tắt "Apply Service Fee to Gift Card" trên Portal giữa 2 bước |         |
| GC2 | ON/OFF, Done        | —                                                       | 🧱 như GC1                                                              |         |
| GC3 | ON/OFF, sửa service | —                                                       | 🧱 như GC1                                                              |         |
| GC4 | OFF/ON, sửa service | —                                                       | 🧱 như GC1                                                              |         |
| GC5 | OFF/OFF, thêm staff | vq RO-013 (toggle OFF mặc định, có dòng GC) + vq RO-042 | ⚠️ phủ gián tiếp                                                        |         |
| GC6 | OFF/ON, void-all    | —                                                       | 🧱 như GC1                                                              |         |
| GC7 | ON/OFF, split có GC | —                                                       | 🧱 như GC1                                                              |         |

## C. Regression từ bug

| ID  | Nguồn      | Test phủ                                             | Loại                                                              | Kết quả |
| --- | ---------- | ---------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| R01 | VP-3931    | vq RO-010 (Cash = base × (1+tax), không SF)          | ✅ công thức (store 14 không phải SF5/Tax10)                      |         |
| R02 | VP-3957    | methods RO-011/RO-212                                | ✅ công thức                                                      |         |
| R03 | VP-4012    | methods RO-212; vq RO-013                            | ✅ công thức                                                      |         |
| R04 | VP-4013    | vq RO-013 (không số lẻ)                              | ✅                                                                |         |
| R05 | VP-4079    | vq RO-014                                            | ⚠️ cần `VOLT_TEST_PRODUCT`                                        |         |
| R06 | VP-4067    | vq RO-060/RO-506; e2e E2E-029                        | ✅                                                                |         |
| R07 | VP-4405 §4 | core "Add a service… Σ lines = Subtotal"             | ✅                                                                |         |
| R08 | VP-4405 §4 | core RO-107                                          | ✅                                                                |         |
| R09 | VP-4405 §5 | core RO-063; vq RO-102                               | ✅ (PO còn chốt $25 vs $27.50)                                    |         |
| R10 | VP-4912    | 4912 TC-VP4912-02..12                                | ✅                                                                |         |
| R11 | VP-5020    | 5020 TC-VP5020-02..10                                | ✅ phần Windows (đơn split tạo trên Windows, không phải P8D)      |         |
| R12 | VP-5297    | 5297 TC-VP5297-02..09                                | ✅                                                                |         |
| R13 | VP-4405 §1 | —                                                    | 🧱 cần so với P8D                                                 |         |
| R14 | VP-4405 §2 | —                                                    | 🧱 cần merchant SF4/CD4/Tax10                                     |         |
| R15 | VP-3982    | vq RO-050                                            | ✅                                                                |         |
| R16 | VP-4405 §3 | (a) gaps TC-REOPEN-04; (b) vq RO-052                 | ⚠️ phần P8D không tự động                                         |         |
| R17 | VP-4980    | vq RO-051 + RO-052                                   | ✅                                                                |         |
| R18 | VP-4980    | gaps TC-REOPEN-06                                    | ✅                                                                |         |
| R19 | VP-5293    | 5293 TC-5293-00..02                                  | ✅                                                                |         |
| R20 | VP-4085    | —                                                    | 🧱 không đọc được point_bonus / checkin của đơn không khách từ UI |         |
| R21 | VP-4085    | gaps TC-REOPEN-04                                    | ✅                                                                |         |
| R22 | VP-4085    | vq RO-110 (tăng); gaps TC-REOPEN-05 (giảm)           | ✅                                                                |         |
| R23 | VP-3913    | flow RO-07/RO-08; vq RO-101                          | ✅                                                                |         |
| R24 | VP-3914    | flow RO-01/02; core RO-001                           | ✅                                                                |         |
| R25 | VP-4037    | core OH-178/OH-182 (Canceled); core OH-160 (Re-open) | ⚠️ Pending/Refund*/Canceling chưa phủ                             |         |
| R26 | VP-3148    | core RO-040                                          | ✅                                                                |         |

## Kết quả lần chạy

_(điền sau lượt chạy `npm run test:reopen`)_
