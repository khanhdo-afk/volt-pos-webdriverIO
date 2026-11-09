---
title: Split Order — gift card trả 1 phần không còn làm mất tip của check — test cases
ticket: VP-3788 — https://linear.app/fastboy/issue/VP-3788/pos-split-order-gift-card-partial-redemption-drops-the-checks-tip
sub-issues: (không có) — liên quan VP-3444, VP-5722 (bản P8D)
spec-files: tests/regression/order-flow/vp-3788-split-gift-card-partial-tip.spec.ts
imported-at: 2026-11-09
updated-at: 2026-11-09
---

# Test Cases – Split Order: gift card trả 1 phần giữ tip của check

**Ticket:** [VP-3788](https://linear.app/fastboy/issue/VP-3788/pos-split-order-gift-card-partial-redemption-drops-the-checks-tip) · PR volt-pos#3360 (dev Thien Duy) · liên quan VP-3444, VP-5722
**Trạng thái:** QC Completed — test tay trên dev **1.1.109** (09/11/2026): 6/6 PASS (đơn OD261109-15344130 và OD261109-15630991).

## Hành vi mong đợi

1. Split **By Amount**, check có tip, trả bằng gift card **không đủ** số dư → dialog "Gift Card not Enough Balance"
   có nút **Create New Check**. Bấm nút: số dư thẻ trả phần **base** của check trước, phần còn lại + **toàn bộ tip**
   chuyển sang check mới.
2. Panel Receipt Details vẫn hiện Tip ban đầu, Total không đổi; check mới được chọn sẵn và mang đúng tip đó.
3. Hoàn tất đơn: `order.tipAmount` = tip; giao dịch của check mới mang tip; giao dịch gift card `tip = 0`;
   Order History hiện đúng Tip và Total. Tổng tiền khách trả không đổi.
4. Quy tắc mới (reviewer chốt 06/11, thay Requirements 3/4): số dư thẻ nằm trong khoảng **[base − $1, base + tip]**
   → bị **từ chối**: dialog chỉ có "Select Another Method", không có "Create New Check", không trừ thẻ.
5. Cancel ở dialog "not Enough Balance" → không trừ thẻ, check vẫn chưa trả, tip giữ nguyên.

## Điều kiện chung

- Môi trường DEV, merchant #14, POS Windows dev **bản mới nhất** trên feed, cửa sổ khách `/customer/` mở (tip hỏi ở màn khách → No Tip).
- Đơn: staff `VOLT_TEST_STAFF` (mặc định Pamela), service `VP3788_SERVICE` (mặc định Dark Queen, $103 → $108.15).
  Check 1 By Amount ≈ $54.07 (giá card) / $52.49 (giá gift card).
- Tip cashier cho check 1: `VP3788_TIP_CENTS` (mặc định `800` = $8.00).
- Gift card **tự xoay** (`src/data/static/giftCardRotation.ts`): số dư thật POS hiển thị được ghi vào
  `.tmp/giftcard-balances.json` (git-ignored); thẻ hết tiền / "not valid" ghi $0 và không được chọn lại.
  - Thẻ thiếu số dư (TC-02/03/08): số dư $1 … (base gift card − $1), nhỏ trước; `VP3788_SHORT_CARDS` (mã, cách dấu phẩy) được thử trước.
    **Mỗi lần chạy TC-03 tiêu hết số dư 1 thẻ** → lần sau tự lấy thẻ kế tiếp. Ngày 09/11 còn 2 thẻ đủ điều kiện
    (393634109804 $47, 141455149999 $50) → nạp thêm hoặc thêm mã qua env khi hết.
  - Thẻ cho case từ chối (TC-09): số dư ≥ base, $53–$200 trước rồi tới thẻ giàu hơn; `VP3788_REFUSE_CARDS`. Không bị trừ tiền
    (tip được tính theo số dư thẻ để rơi vào khoảng bị từ chối).
- Passcode staff tiệm 14: 8888 (`VOLT_STAFF_CODE`). Không cần terminal (chỉ Gift Card + Cash).
- Ghi dữ liệu thật (tạo + thanh toán đơn, trừ gift card) → chỉ dev / staging, `WRITE_ALLOWED` bật.

Chú thích trạng thái: ✅ tự động được · ⚠️ tự động được, có điều kiện (cần thẻ còn số dư phù hợp).

## 1. Thẻ thiếu số dư → Create New Check (đơn A)

| TC ID        | Title                                                                | Priority | Precondition          | Test Data              | Steps                                                                           | Expected Result                                                                                                                                           | Status        |
| ------------ | -------------------------------------------------------------------- | -------- | --------------------- | ---------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| TC-VP3788-01 | Split By Amount + tip cho Check 1                                    | High     | Home, không có đơn mở | Dark Queen, tip $8.00  | 1. Tạo đơn → Split → By Amount. 2. Chọn Check 1 → Tip → $8.00 → Add             | Check 1 = giá card cũ + $8.00; panel Receipt Details có Tip $8.00                                                                                         | ✅ PASS 09/11 |
| TC-VP3788-02 | Thẻ thiếu số dư → dialog "not Enough Balance" có Create New Check    | Critical | TC-01                 | Thẻ số dư < base − $1  | Check 1 → Gift Card → Pay → Input Gift Card Code → nhập thẻ → Confirm           | Dialog "Gift Card not Enough Balance", có Current Balance, Amount Needed = base gift card + tip; có nút Create New Check                                  | ⚠️ PASS 09/11 |
| TC-VP3788-03 | Create New Check → tip vẫn trên panel, Total không đổi               | Critical | TC-02                 | –                      | Bấm Create New Check                                                            | Check 1 "Paid with Gift Card … Total Paid: <số dư thẻ>"; panel vẫn Tip $8.00; Total = Total trước đó                                                      | ⚠️ PASS 09/11 |
| TC-VP3788-04 | Check mới được chọn sẵn và mang tip                                  | Critical | TC-03                 | –                      | 1. Đọc danh sách check. 2. Bấm Tip trên check đang chọn → đọc → Close           | Có check mới (số lớn nhất) đang được chọn; số tiền = (giá card Check 1 − số dư thẻ) + tip; dialog Tip hiện $8.00                                          | ⚠️ PASS 09/11 |
| TC-VP3788-05 | Trả nốt bằng Cash → check mới ghi "Tip: $8.00", màn Success đúng tip | Critical | TC-04                 | Cash                   | 1. Trả check mới bằng Cash. 2. Trả Check 2 bằng Cash (No Tip). 3. Complete Done | Dialog paid của check mới có "Tip: $8.00"; Payment Successful có "Total Tip: $8.00" và "<staff> - $8.00"                                                  | ⚠️ PASS 09/11 |
| TC-VP3788-06 | Dữ liệu order: tipAmount + tip trên đúng giao dịch                   | Critical | TC-05                 | Đọc DB local (graphql) | Đọc order theo mã                                                               | status successful; `tipAmount` = 800; giao dịch gift_card `tip` = 0 và `amount` = số dư thẻ; đúng 1 giao dịch cash `tip` = 800; Σ(amount + tip) = `total` | ⚠️ PASS 09/11 |
| TC-VP3788-07 | Order History hiện đúng Tip và Total                                 | High     | TC-05                 | –                      | Order History → mở đơn A                                                        | Tip $8.00; tip của staff $8.00; Total = tổng các payment                                                                                                  | ⚠️ PASS 09/11 |

## 2. Cancel và case bị từ chối (đơn B — không trừ tiền thẻ)

| TC ID        | Title                                                                | Priority | Precondition | Test Data                                   | Steps                                                                                                                    | Expected Result                                                                                                               | Status        |
| ------------ | -------------------------------------------------------------------- | -------- | ------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- |
| TC-VP3788-08 | Cancel ở dialog "not Enough Balance" → không trừ thẻ, tip giữ nguyên | High     | Home         | Đơn B mới, tip $8.00, thẻ thiếu số dư       | 1. Tạo đơn B → Split By Amount → Check 1 tip $8.00. 2. Gift Card → nhập thẻ thiếu → dialog Create New Check → **Cancel** | Không có giao dịch nào trong DB; Check 1 chưa trả; panel vẫn Tip $8.00                                                        | ⚠️ PASS 09/11 |
| TC-VP3788-09 | Số dư nằm giữa base − $1 và base + tip → bị từ chối                  | Critical | TC-08        | Thẻ số dư ≥ base; tip T = số dư − base + $3 | 1. Dò số dư thẻ (Confirm không tip → Cancel). 2. Đặt tip T cho Check 1. 3. Gift Card → nhập thẻ → Confirm                | Dialog "Gift Card not Enough Balance" chỉ có "Select Another Method", **không** có Create New Check; Amount Needed = base + T | ⚠️ PASS 09/11 |
| TC-VP3788-10 | Select Another Method → không giao dịch, tip giữ nguyên              | High     | TC-09        | –                                           | Bấm Select Another Method                                                                                                | Dialog đóng; DB không có giao dịch; Total Paid $0.00; panel vẫn Tip = T                                                       | ⚠️ PASS 09/11 |

## Kết quả chạy spec (09/11/2026, POS dev 1.1.113 — bản mới nhất trên feed)

Lệnh: `npm run test:attach -- --spec tests/regression/order-flow/vp-3788-split-gift-card-partial-tip.spec.ts` (~10′).

- **Lượt 1 (14:29):** 6/10 — TC-04 fail do spec nhận diện check đang chọn bằng `aria-checked` (1.1.113 chỉ tô `bg-primary`);
  root hook đụng màn split → app gộp check còn lại vào Check 2 (tip $8 vẫn giữ) → TC-05/06/07 fail dây chuyền. Không phải lỗi app.
- **Sửa:** nhận diện theo `bg-primary`; TC-05 trả mọi check chưa trả; thêm xoay gift card + nhớ số dư.
- **Lượt 2 (14:46):** 10/10 PASS — tự bỏ thẻ ••••0874 (đã hết tiền), dùng ••••1736.
- **Lượt 3 (14:57):** 10/10 PASS — tự lấy thẻ kế tiếp ••••7163, không sửa gì → chạy lặp lại được.
- **Tổng: 10/10 PASS.**
