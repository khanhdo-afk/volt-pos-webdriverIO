# Checklist re-test các TC chính — Volt POS (Windows)

> Mục đích: mỗi lần có build mới cần re-test thì chạy bộ này thay vì ~900 TC đầy đủ.
> TC được chọn từ các file `docs/screens/*/…-test-cases.md` (ưu tiên P1 / High / Critical, luồng happy path
> và các phép tính tiền). Mỗi TC có tiền điều kiện, bước test và kết quả mong đợi lấy từ file gốc (link "Nguồn" ở từng TC).
>
> - ⭐ = **smoke**: build nào cũng phải chạy (41 TC, khoảng 1–1,5 giờ test tay).
> - Không có ⭐ = **core**: chạy khi build đụng vào nhóm tính năng đó, hoặc trước khi lên production.
> - Thanh toán Card: chỉ charge số tiền nhỏ (0.01–0.50 USD) khi test trên production.
> - Mỗi TC tick ☐ PASS / FAIL / BLOCKED và ghi chú (mã bug VP, lý do BLOCKED). Cuối file có bảng tổng kết.

**Build:** `________` · **Môi trường:** DEV / STAGING / PROD · **Tiệm:** `____` · **Ngày:** `__/__/____` · **Người test:** `____`

---

## 1. Tạo order (Home) — [order-flow](../screens/order-flow/order-flow-test-cases.md)

### ⭐ TC-01 · Home hiển thị đủ 3 khối Staff / Service / Cart

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã login, ở `/home`
- **Bước:** Mở `/home`
- **Kỳ vọng:** Staff list (search + tabs All/Group), Service list (search + category grid gồm Quick Pay/Gift Card đầu tiên), placeholder cart trống hoặc "Add Staffs and Services" đều hiển thị
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-02 · Chọn Service trước Staff → popup "Select Staff First"

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order chưa có staff
- **Bước:** Click 1 service trong catalogue khi chưa chọn staff
- **Kỳ vọng:** Popup "Select Staff First" — "Please select a staff before choosing services.", nút Done
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-03 · Chọn Staff → chọn Service thành công, nút Pay bật

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở `/home`
- **Bước:**
  1. Click 1 card staff (vd Amelia)
  2. Click 1 service
- **Kỳ vọng:** Staff card active, cart hiện nhóm theo staff, service được thêm với giá đúng, nút Pay enable
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-07 · Nhập SĐT khách cũ → gán đúng khách

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã có customer trong hệ thống
- **Bước:** Nhập số phone đã tồn tại
- **Kỳ vọng:** Dialog "Customers Found" hiện list; chọn 1 dòng gắn customer vào order
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-06 · Nhập SĐT mới → tạo khách mới

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order chưa gán customer
- **Bước:**
  1. Click "Enter Customer Phone, Name or Email"
  2. Nhập số phone mới hợp lệ
  3. Click Done
- **Kỳ vọng:** Dialog "Add new customer": Phone (đã điền), Customer Name (optional, default Unknownxxxx), Group, Save/(X)/View More
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-15 · Quick Pay: nút Add chỉ bật khi có Amount + Service Name

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Dialog Quick Pay đang mở
- **Bước:**
  1. Chỉ nhập Amount
  2. Kiểm tra Add vẫn disabled
  3. Nhập thêm Service Name
- **Kỳ vọng:** Add chuyển sang enabled chỉ sau khi có đủ 2 field required
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-18 · Promo & Rewards mở dialog, áp discount được

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Cart có ít nhất 1 service
- **Bước:** Click "Promo & Rewards"
- **Kỳ vọng:** Dialog Add Promo: list Promo hệ thống + Custom (% min 0.1% max 100%, hoặc $ ≤ giá trước Reward/Tax)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-21 · Cart: Subtotal / Tax / Total tính đúng

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Cart có 1 service $11.00, tax 10%
- **Bước:** Xem Summary
- **Kỳ vọng:** Subtotal $11.00, Tax $1.10, Total $12.10 khớp
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-75 · Search toàn cục theo Order ID → mở đúng Order Detail

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có order tồn tại
- **Bước:** Nhập Order ID vào Search
- **Kỳ vọng:** Tab Order trả đúng order, click redirect `/order-history/<id>`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 2. Checkout / Thanh toán — [order-flow](../screens/order-flow/order-flow-test-cases.md), [charge-fee](../screens/charge-fee/charge-fee-test-cases.md)

### TC-39 · 4 phương thức hiển thị amount khác nhau đúng (service fee / cash discount)

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order đã Pay, ở `/checkout`
- **Bước:** Xem 4 nút Card/Cash/Gift Card/Other
- **Kỳ vọng:** **Card = total gồm service fee** (VD $30.25); **Cash/Gift Card/Other = total sau cash discount, bỏ tax** (VD $27.50). Amount in ngay trên từng nút, KHÁC nhau — không phải cùng 1 order total.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-42 · Cash đủ tiền → "Complete Payment", tiền thối đúng

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở Cash
- **Bước:** Nhập Amount ≥ Total Order
- **Kỳ vọng:** Nút đổi thành "Complete Payment", Remaining = 0
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-40 · Cash quick amount ($5/$10/$50/$100)

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở checkout, chọn Cash
- **Bước:**
  1. Chọn Cash
  2. Click Quick amount (**$5 / $10 / $50 / $100**)
- **Kỳ vọng:** Amount field cập nhật theo quick amount; Change hiển thị nếu Amount > Total. (Chọn Cash tự điền đúng total → Remaining=0 → nút chuyển "Complete Payment" ngay.)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-82 · Card: tender điền sẵn đúng số còn phải trả

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở checkout, order có ≥1 service
- **Bước:** Chọn tender Card
- **Kỳ vọng:** Entry tự điền số tiền phải trả (>0); remaining = 0
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-84 · Card: charge thành công → màn Payment Successful

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Terminal Card đã kết nối; biết staff code của tiệm. Trên PROD chỉ charge 0.01–0.50 USD.
- **Bước:**
  1. Tạo order (staff + service)
  2. Chọn Card → Complete Payment
  3. Nhập staff code
  4. Màn khách: chọn No Tip → ký (nếu có) → Continue
  5. Quẹt / chạm thẻ ở terminal
  6. Màn khách ký lần 2 (nếu có) → Continue
- **Kỳ vọng:** Charge được duyệt → sang màn Payment Successful, có 4 lựa chọn Receipt; Continue → về Home, cart trống. Không bị kẹt ở dialog "charging".
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-45 · Trả bằng Gift Card (nhập code)

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở checkout, chọn Gift Card
- **Bước:**
  1. Chọn Gift Card
  2. "Input Gift Card Code"
  3. Nhập code hợp lệ
  4. Confirm
- **Kỳ vọng:** "Gift Card Accepted" hiển thị, sau đó Pay khả dụng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-46 · Trả bằng Other (bắt buộc nhập tên method)

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở checkout, chọn Other
- **Bước:**
  1. Chọn Other
  2. Nhập "Input payment method name"
  3. Complete Payment
- **Kỳ vọng:** Payment Success hiển thị "Other (<tên đã nhập>)"
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-76 · Complete Payment yêu cầu staff code

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở checkout, đã chọn method + đủ amount
- **Bước:** Click "Complete Payment"
- **Kỳ vọng:** Hiện dialog **"Enter staff code to complete payment"** + keypad số. Nhập passcode owner (8888 cho tiệm 20258) mới đi tiếp. Sai passcode → chặn.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-81 · Màn khách hiện "Add a tip", tip chọn bên khách về đúng màn chính

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Sau staff code (đang tip-wait), drive target `/customer/`
- **Bước:**
  1. Xem màn khách
  2. Chọn quick tip / No Tip / Custom Tip
  3. Continue
- **Kỳ vọng:** "Add a tip" · "Tip based on total: $X" (= tổng **giá gốc service**, không gồm tax/fee) · quick **15% / 18% / 20% / 25%** (kèm số tiền) · **Custom Tip** · **No Tip** · **Continue** (disabled tới khi chọn). Chọn xong → màn khách "Payment complete" + 4 action Receipt.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-50 · Payment Successful có đủ 4 lựa chọn Receipt

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Sau Complete Payment + staff code + customer chọn tip
- **Bước:** Xem màn Payment Successful!
- **Kỳ vọng:** Reception: heading **"Payment Successful!"** + **Adjust Tip / Split Tip** (nếu >1 staff+tip) + **No Receipt / Print / Text Message / Email**. Customer: "Payment complete" + 4 action tương tự. **Đã drive được màn khách qua raw CDP `/customer/` target** (msedgedriver không thấy handle — xem B2.2).
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-CHF-18 · Settings › Charge & Fee hiện đúng Tax hiện tại

_Nguồn: [charge-fee-test-cases.md](../screens/charge-fee/charge-fee-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Section Tax Setting mở
- **Bước:** Đọc `input[name="taxPercentage"]`
- **Kỳ vọng:** Value `10`, có suffix `%`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 3. Split Order — [split-order](../screens/split-order/split-order-test-cases.md), [payment-flows](../screens/order-flow/payment-flows-test-cases.md)

### ⭐ TC-SPLIT-03 · Equally mặc định 2 check chia đôi Order Total

_Nguồn: [split-order-test-cases.md](../screens/split-order/split-order-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang ở tab Equally
- **Bước:** Quan sát 2 Check card
- **Kỳ vọng:** 2 Check hiện `getByText('Check 1')` / `getByText('Check 2')`; tổng 2 amount = Order Total; nếu lẻ, Check 2 (cuối) nhận phần dư (VD $1,213.81 → $606.90 + $606.91).
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SPL-03 · Equally N check, check cuối bù số lẻ ($100/3 → 33.33/33.33/33.34)

_Nguồn: [payment-flows-test-cases.md](../screens/order-flow/payment-flows-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order total $100 (số không chia hết cho 3)
- **Bước:**
  1. Mở Split Order → tab Equally
  2. Bấm Add New Check để có 3 check
- **Kỳ vọng:** Các check là 33.33 / 33.33 / 33.34; tổng các check = Order Total
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SPLIT-06 · By Amount: sửa 1 check → check cuối tự tính lại

_Nguồn: [split-order-test-cases.md](../screens/split-order/split-order-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang ở tab By Amount, 2 Check
- **Bước:**
  1. Click vào amount Check
  - 1.
  2. Xoá hết bằng backspace.
  3. Nhập số tiền hợp lệ nhỏ hơn Order Total (VD 70000 → $700.00).
  4. Bấm `button "Done"`.
- **Kỳ vọng:** Check 1 = $700.00; Check 2 tự cập nhật = Order Total − $700.00 (VD $513.81); Remaining giữ nguyên = Order Total.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SPLIT-07 · By Amount: nhập vượt Order Total bị revert

_Nguồn: [split-order-test-cases.md](../screens/split-order/split-order-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang ở tab By Amount
- **Bước:**
  1. Click amount Check
  - 1.
  2. Nhập số khiến amount > Order Total (VD append "3" vào $606.90 → $6,069.03).
  3. Bấm `Done`.
- **Kỳ vọng:** Amount tự động revert lại giá trị hợp lệ trước đó (VD $606.90), không lưu giá trị vượt quá; không cho Check 2 nhận số âm.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SPLIT-08 · By Items: gán item vào từng check

_Nguồn: [split-order-test-cases.md](../screens/split-order/split-order-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order có ≥2 line item
- **Bước:** Bấm tab `By Items`
- **Kỳ vọng:** Mỗi Check hiện list item dạng `checkbox "<tên> $<giá>"`; tổng amount mỗi Check = tổng giá item được gán; có nút "How to Split Payment by Item?".
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ SPL-06 · Mỗi check trả độc lập; trả hết → order Successful

_Nguồn: [payment-flows-test-cases.md](../screens/order-flow/payment-flows-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order đã split thành 2 check
- **Bước:**
  1. Trả check 1 bằng Cash
  2. Xem status order
  3. Trả check 2 bằng phương thức khác (Card / Other)
- **Kỳ vọng:** Sau check 1: order ở Processing, check 1 không sửa được nữa. Sau check 2: order Successful, Order History có đủ 2 payment.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SPLIT-12 · Pay disable khi check chưa chọn payment method

_Nguồn: [split-order-test-cases.md](../screens/split-order/split-order-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Vừa mở Split Order, chưa chọn gì
- **Bước:** Quan sát nút Pay
- **Kỳ vọng:** `button "Pay $<amount>"` có `[disabled]`.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 4. Order History & xử lý sau thanh toán — [order-history](../screens/order-history/order-history-test-cases.md), [order-flow](../screens/order-flow/order-flow-test-cases.md)

### ⭐ TC-OH-01 · Trang tải, danh sách đơn theo ngày

_Nguồn: [order-history-test-cases.md](../screens/order-history/order-history-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã đăng nhập
- **Bước:** Vào `/order-history`
- **Kỳ vọng:** Header "Order History", nút DatePicker (dải ngày), nút "Filter", ô Search đều hiển thị
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-OH-04 · Mở chi tiết đơn: Information / Summary / Payment đúng

_Nguồn: [order-history-test-cases.md](../screens/order-history/order-history-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có ≥1 đơn
- **Bước:** Click thẻ đơn đầu
- **Kỳ vọng:** URL đổi thành `/order-history/<id>`; nút "Receipt" hiển thị
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-OH-10 · Search theo mã đơn (partial)

_Nguồn: [order-history-test-cases.md](../screens/order-history/order-history-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Biết 1 mã đơn hiển thị
- **Bước:** Gõ 1 phần mã vào Search
- **Kỳ vọng:** Danh sách chỉ còn (các) đơn khớp; đơn đã gõ vẫn hiện
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-OH-12 · Filter (Sort / Staff / Payment / Status)

_Nguồn: [order-history-test-cases.md](../screens/order-history/order-history-test-cases.md)_

- **Bước:** Click "Filter"
- **Kỳ vọng:** Dialog mở, có nhóm Sort by / Staff / Payment method / Status
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-55 · Đơn Unsettled: Adjust Tip / Receipt / Re-Open / Cancel

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** [LINEAR-ONLY] Order status Successful - Unsettled
- **Bước:** Mở order Unsettled
- **Kỳ vọng:** ✅2026-09-02 Action buttons: **Adjust Tip, Receipt, Re-Open Order, Cancel Order**. Split Tip chỉ hiện khi order >1 staff (order 1 staff không có)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-56 · Đơn Settled: Receipt / Refund / Partial Refund

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order status Successful - Settled (nếu có sẵn trong demo data)
- **Bước:** Mở order Settled
- **Kỳ vọng:** ⚠️2026-09-02 Action buttons: **Receipt + Refund** — 1 nút Refund GỘP (full/partial theo service chọn trong dialog), KHÔNG có nút Partial Refund riêng; không có Cancel/Re-Open
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-61 · Refund All = Full Refund, tự điền đúng total

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order Settled, nhiều service
- **Bước:**
  1. Click Refund
  2. Chọn option "All"
- **Kỳ vọng:** Amount autofill = total order (gồm Tip nếu có)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-64 · Cancel order: confirm + bắt buộc nhập reason

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order Unsettled
- **Bước:**
  1. Click Cancel Order
  2. Chọn reason
  3. Confirm Cancel
- **Kỳ vọng:** Dialog "Cancel Order — Are you sure...? **All payments will be voided.**" + dropdown **"Select cancellation reason"** (bắt buộc) + **Keep Order / Confirm Cancel** (disabled tới khi chọn reason). Bước submit + staff code chưa chạy (safety-classifier chặn thao tác cancel thật).
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-57 / TC-58 · Đơn Canceled / Refunded hiện đúng block thông tin

**TC-57** — Order Detail — Canceled: chỉ có Receipt + Cancel Information

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order status Canceled
- **Bước:** Mở order Canceled
- **Kỳ vọng:** ⚠️2026-09-02 Chỉ action Receipt. KHÔNG có block "Cancel Information" riêng — **Payment Details** hiện transaction gốc + dòng **Voided**; "By Staff" = field **Cashier** trong Order Information

**TC-58** — Order Detail — Refunded: chỉ có Receipt + Refund Information

_Nguồn: [order-flow-test-cases.md](../screens/order-flow/order-flow-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Order status Refunded
- **Bước:** Mở order Refunded
- **Kỳ vọng:** Chỉ action Receipt; block "Refund Information": title "Refund #OD-ID-CheckID", Amount, Date & Time, Method, By Staff, Reason

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 5. Order Pending & Check-in GoCheckin — [order-pending](../screens/order-pending/order-pending-test-cases.md), [06-pending-checkin](volt-qc/windows-regression/06-pending-checkin.md)

### ⭐ TC-OP-01 · Màn tải, toolbar hiển thị

_Nguồn: [order-pending-test-cases.md](../screens/order-pending/order-pending-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** App đã đăng nhập
- **Bước:** `goto('/order-pending')`
- **Kỳ vọng:** Heading "Pending Orders" hiển thị; toolbar có Search, Staff filter, Sort, Date range, Quick Checkout
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-OP-02 · Card đơn chờ đúng cấu trúc

_Nguồn: [order-pending-test-cases.md](../screens/order-pending/order-pending-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có ≥1 Pending Order
- **Bước:**
  1. Mở màn
  2. Đọc card đầu
- **Kỳ vọng:** Card có mã dạng `OD######-########`, giờ tạo, trạng thái "Processing"
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-OP-03 · Tìm theo Order ID lọc đúng

_Nguồn: [order-pending-test-cases.md](../screens/order-pending/order-pending-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có ≥1 order, biết 1 mã
- **Bước:** Gõ 8 số cuối của 1 mã vào Search
- **Kỳ vọng:** Chỉ còn card khớp; các card khác biến mất
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ PEND-045 · Khách cũ check-in GoCheckin → đúng 1 order pending

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** Ghi lại baseline trên POS `/home`: số **Pending Orders** (sidebar) = P, **Checkin Today (N)** = C. Có SĐT khách cũ S chưa check-in hôm nay.
- **Bước:**
  1. GoCheckin (`checkin.gocheckin.net/checkin`, đúng tiệm đang test): nhập S → **NEXT** → màn chọn dịch vụ **SKIP** → màn check-in thành công
  2. Chờ ~5 giây, xem lại POS (không reload)
- **Kỳ vọng:**
  - GoCheckin hiện "Hi <tên>, welcome back!"
  - POS: Pending = P + 1, Checkin Today = C + 1
  - Đúng 1 order mới: tên khách đúng, 4 số cuối SĐT đúng, pill **Checked-in**, trạng thái **Processing**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ PEND-048 · Khách mới check-in (nhập tên, ký consent) → order pending

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** Ghi lại baseline trên POS `/home`: số **Pending Orders** (sidebar) = P, **Checkin Today (N)** = C. SĐT mới N chưa có trong hệ thống.
- **Bước:**
  1. GoCheckin: nhập N → **NEXT** → màn nhập tên → nhập tên (chỉ chữ cái, vd "QC Test") → **NEXT**
  2. SKIP email, ngày sinh, dịch vụ → màn ký consent: ký tên → **NEXT**
  3. Chờ ~5 giây, xem lại POS
- **Kỳ vọng:**
  - GoCheckin thành công, hiện "You had 0 points"
  - POS: Pending + 1, Checkin Today + 1
  - Order mới đúng tên vừa nhập, SĐT che `***-***-<4 số cuối>`, **0 Pts**, pill **Checked-in**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### PEND-050 · Số đã check-in (chưa checkout) bị chặn, không tạo order mới

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** SĐT S vừa check-in thành công, order còn pending.
- **Bước:**
  1. GoCheckin: nhập lại S → **NEXT**
  2. Xem POS
- **Kỳ vọng:**
  - GoCheckin hiện alert **You have checked in already**
  - POS: Pending và Checkin Today **không đổi**, không có order mới
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### PEND-055 · Order check-in về POS trong vài giây

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** POS đang mở `/home`.
- **Bước:**
  1. Check-in 1 số trên GoCheckin, bấm giờ khi tới màn check-in thành công
  2. Đo thời gian tới khi thẻ mới xuất hiện ở sidebar Pending trên POS
- **Kỳ vọng:** Thẻ mới xuất hiện trong ≤ 5 giây (thường 2–4 giây). Trên 15 giây là lỗi.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ PEND-056 · Khách check-in hiện ở cả Pending Orders, /order-pending và Checkin Today

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** Vừa check-in khách K trên GoCheckin.
- **Bước:**
  1. Không reload app, xem sidebar **Pending Orders**
  2. Mở trang **Order Pending** (`/order-pending`)
  3. Bấm **Checkin Today (N)** → **Show**
- **Kỳ vọng:** Order của K có ở cả 3 nơi, không cần khởi động lại app
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### PEND-041 · Checkin Today hiện đúng số lượng và thẻ check-in hôm nay

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

> ⚠️ 10/11: luồng **Checkin Today** đang có vấn đề, dev đang kiểm tra lại. Nếu FAIL thì ghi chú và đối chiếu với kết luận của dev.

- **Tiền điều kiện / dữ liệu:** Có ít nhất 1 lượt check-in hôm nay.
- **Bước:**
  1. Ở Home bấm **Quick Checkout**
  2. Bấm **Checkin Today (N)** (chữ **Show**)
- **Kỳ vọng:**
  - Nút đổi thành **Hide**
  - Mỗi thẻ có: trạng thái (**Active** / **Completed** / **Finished**), badge **Walk-in** hoặc **Appointment**, tên khách, **Checkin: N minutes ago** (hoặc giờ), SĐT che `***-***-xxxx`, **Staff: Unknown yet** khi chưa có staff
  - N = số thẻ trong danh sách
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### PEND-057 · Mở order check-in → checkout hiện đúng tên khách

_Nguồn: [06-pending-checkin.md](volt-qc/windows-regression/06-pending-checkin.md)_

- **Tiền điều kiện / dữ liệu:** Có order check-in của 1 khách test.
- **Bước:**
  1. Mở order check-in từ Pending
  2. Thêm staff + service
  3. Bấm **Pay**
- **Kỳ vọng:** Cột chi tiết checkout hiện đúng tên khách, SĐT, **Points: N**, **Total visits: N**; không hiện **Unknown**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 6. Reopen / Edit Order — [reopen](../screens/order-flow/reopen-test-cases.md)

### ⭐ RO-01 · Re-Open có trên đơn unsettled, dialog mở/đóng được

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Tạo đơn cash → Order History → mở đơn → bấm Re-Open Order → Cancel
- **Kỳ vọng:** Nút hiện, Refund không hiện; dialog mở có text; Cancel đóng dialog, đơn không đổi
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-02 · Dialog báo còn lượt sửa

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Đơn mới chưa reopen → mở dialog
- **Kỳ vọng:** Có câu `One edit of items, prices left`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-03 · Confirm reopen → checkout chế độ edit, không phát sinh tiền

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Confirm (+ passcode nếu có)
- **Kỳ vọng:** URL `/order/{id}/checkout?editOrderId`; Enter Amount = $0.00; nút **Re-Open Done**; header có link **Edit Order**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-05 · Re-Open Done không sửa gì → không tốn lượt

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Continue Re-open → Re-Open Done → mở lại đơn
- **Kỳ vọng:** Đơn về Successful; nút `Re-Open Order`; dialog vẫn `One edit … left`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ RO-06 · Reopen + thêm service → thu phần chênh bằng Cash đúng

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Reopen → Edit Order → Home thêm 1 service → Pay → tab Cash
- **Kỳ vọng:** Enter Amount (= tile Cash) = Total mới − số đã trả, đúng tới cent (live: $60 + $100 → Total $176, due **$110.00**, Card $121.00); trả Cash → Payment Success
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-10 · Reopen + thêm service, trả Card đúng

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Như RO-06 nhưng tab Card
- **Kỳ vọng:** Card = (Δ + SF) + tax(Δ + SF); Card ≥ Cash
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-11 · Reopen + thêm Product, trả Card: product tax áp dụng

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Thêm product thay vì service
- **Kỳ vọng:** Tax có phần product tax
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### RO-07 · Đã dùng lượt → dialog báo hết lượt

_Nguồn: [reopen-test-cases.md](../screens/order-flow/reopen-test-cases.md)_

- **Bước:** Mở lại đơn vừa sửa → Re-Open
- **Kỳ vọng:** Câu `Items and prices are locked`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 7. Điểm thưởng / Checkout Type / Khách hàng — [checkout-type](../screens/checkout-type/checkout-type-test-cases.md), [earn-points-on-tip](../screens/earn-points-on-tip/earn-points-on-tip-test-cases.md), [customer-group](../screens/customer-group/customer-group-test-cases.md)

### CHK-POS-003 · Đổi Checkout Type trên Portal áp ngay, không cần restart POS

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** POS đang mở, setting = Manual · Full Set $40, trả Cash/Card
- **Bước:**
  1. Portal: đổi sang Auto, Save
  2. Không restart POS
  3. Check-in GAP, mở order, Pay, Complete
- **Kỳ vọng:** **+10** (Auto)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ CHK-POS-007 · Manual, trả Cash: điểm theo Point Config

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Manual · Acrylic Removal 3 $20, trả Cash
- **Bước:**
  1. Check-in khách trên GAP kiosk
  2. POS: mở order pending (Checked-in), thêm service
  3. Pay Cash
  4. Complete
- **Kỳ vọng:** Theo tiền khách trả thật (+21 cho $21)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### CHK-POS-006 · Manual, trả Card: điểm theo Point Config

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Manual · Full Set $40, trả Card (Win: Other $42)
- **Bước:**
  1. Check-in khách trên GAP kiosk
  2. POS: mở order pending (Checked-in), thêm service
  3. Pay Card
  4. Complete
- **Kỳ vọng:** Theo Point Config (+42 cho $42)
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### CHK-POS-012 · Auto: cộng đúng Point Bonus khi complete

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Auto, bonus 10 · Full Set $40, trả Cash/Card
- **Bước:**
  1. Check-in khách trên GAP kiosk
  2. POS: mở order pending (Checked-in), thêm service
  3. Pay
  4. Complete
- **Kỳ vọng:** **+10**, cộng ngay khi complete
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### CHK-POS-017 · Auto, order $0: không cộng bonus

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Auto · Full Set $40 + reward −$101 → $0
- **Bước:**
  1. Check-in GAP, mở order, thêm service
  2. Redeem toàn bộ
  3. Pay Cash $0, Complete
- **Kỳ vọng:** **0 điểm**, không hiện block điểm
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### CHK-POS-022 · Hybrid complete trong ngày: theo Point Config

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Hybrid, bonus 10 · Lidasy, Cash $63
- **Bước:**
  1. Check-in khách trên GAP kiosk
  2. POS: mở order pending, thêm service
  3. Pay
  4. Complete (trước cuối ngày)
- **Kỳ vọng:** Theo Point Config (+63), **không** cộng 10 điểm bonus; check-in chuyển `finished`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ CHK-POS-027 · Edit Order rồi complete lại không cộng điểm lần 2

_Nguồn: [checkout-type-test-cases.md](../screens/checkout-type/checkout-type-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Setting = Manual; order GCI đã complete, khách đã nhận điểm · Thêm service $30
- **Bước:**
  1. Order History → Re-Open Order → Edit Order
  2. Thêm service
  3. Pay phần chênh lệch, Re-Open Done
- **Kỳ vọng:** **Không cộng thêm**, không chuyển điểm; điểm khách giữ nguyên
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### EPT-02 / EPT-04 · Earn points on tip BẬT / TẮT tính đúng với Cash có tip

**EPT-02** — BẬT: Cash có tip → tính cả tip

_Nguồn: [earn-points-on-tip-test-cases.md](../screens/earn-points-on-tip/earn-points-on-tip-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Cash $63.00 + tip 20% ($12.00) = $75.00
- **Bước:**
  1. Tạo đơn cho khách
  2. Pay Cash → Complete Payment
  3. Màn khách chọn 20% → Continue
- **Kỳ vọng:** **+75** điểm (màn khách = server)

**EPT-04** — TẮT: Cash có tip → không tính tip

_Nguồn: [earn-points-on-tip-test-cases.md](../screens/earn-points-on-tip/earn-points-on-tip-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Cash $63.00 + tip 20% ($12.00)
- **Bước:**
  1. Portal: TẮT Earn points on tip
  2. Tạo đơn cho khách
  3. Pay Cash → Complete Payment
  4. Màn khách chọn 20% → Continue
- **Kỳ vọng:** **+63** (bỏ $12 tip)

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### EPT-11 · Gift card có tip theo Point Config + toggle

_Nguồn: [earn-points-on-tip-test-cases.md](../screens/earn-points-on-tip/earn-points-on-tip-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Gift card $63.00 + tip $12.00
- **Bước:**
  1. Tạo đơn $63 cho khách
  2. Pay bằng Gift Card → Complete Payment
  3. Màn khách chọn tip $12 → Continue
  4. Xem số điểm khách nhận được
- **Kỳ vọng:** Gift card Earning: BẬT **+75** / TẮT **+63** · Gift card "No points": **0**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-CUSTGROUP-03 · Tạo group trùng tên group đã có

_Nguồn: [customer-group-test-cases.md](../screens/customer-group/customer-group-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã có group tên X · X = `QC Dup <rand>`
- **Bước:**
  1. New Group → nhập X → Create.
  2. New Group → nhập lại X → Create
- **Kỳ vọng:** Lần 2 **tạo thành công** (không còn lỗi "already in use"), group mới được tick sẵn; danh sách có 2 dòng X
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-CUSTGROUP-09 · Gán group cho khách mới, group cũ không ảnh hưởng

_Nguồn: [customer-group-test-cases.md](../screens/customer-group/customer-group-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có 2 group cùng tên X (TC-03) · Khách `QC VP4566 <rand>`, SĐT ngẫu nhiên 832…
- **Bước:**
  1. Thêm khách nhanh.
  2. Chỉ tick group X **mới tạo**.
  3. Save
- **Kỳ vọng:** Khách lưu thành công, order mở với khách đó, thanh khách hiện chip X; group X cũ vẫn **không** bị tick
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 8. Appointment — [appointment](../screens/appointment/appointment-test-cases.md)

> Tạm **bỏ qua** các TC tạo appointment trên POS (TC-OPEN-01, TC-OPEN-02, TC-CUST-06, TC-SAVE-01, TC-SAVE-03, TC-SAVE-04, TC-SAVE-10) vì chưa có case create appointment. Các TC dưới đây dùng appointment có sẵn — lấy lịch đặt online ở **SYNC-10**.

### TC-EDIT-05 · Edit sửa field và lưu

_Nguồn: [appointment-test-cases.md](../screens/appointment/appointment-test-cases.md)_

- **Bước:** Mở Edit từ Scheduled/Confirmed, sửa Start time/Staff/Service → Save
- **Kỳ vọng:** Popup "Do you want to send a message to [Customer name]…" (Don't Send / Send); sau khi chọn, status **không đổi** so với trước khi edit
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-CONFIRM-01 · Confirm appointment Scheduled

_Nguồn: [appointment-test-cases.md](../screens/appointment/appointment-test-cases.md)_

- **Bước:** Mở appointment Scheduled → click Confirm
- **Kỳ vọng:** Popup "Are you sure to confirm this appointment?" → xác nhận → gửi SMS confirm, có notification trên POS, status chuyển Confirmed
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-CANCEL-01 · Cancel appointment Scheduled

_Nguồn: [appointment-test-cases.md](../screens/appointment/appointment-test-cases.md)_

- **Bước:** Mở appointment Scheduled → click Cancel → xác nhận
- **Kỳ vọng:** Popup "Are you sure to cancel this appointment?" → xác nhận → gửi SMS cancel, notification POS, status chuyển Canceled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-GUARD-01 · Passcode / staff-code khi Edit / Confirm / Cancel

_Nguồn: [appointment-test-cases.md](../screens/appointment/appointment-test-cases.md)_

- **Bước:** Thực hiện Edit/Confirm/Cancel khi guard đang bật
- **Kỳ vọng:** Yêu cầu nhập passcode/staff-code trước khi thực hiện action — cần xác định task nền cấu hình guard này để biết điều kiện bật/tắt và ai được bypass
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 9. Turn & Chấm công — [turn](../screens/turn/turn-test-cases.md), [time-keeping](../screens/time-keeping/time-keeping-test-cases.md), [time-tracking](../screens/time-tracking/time-tracking-test-cases.md)

### ⭐ TC-TK-03 · Check In một nhân viên

_Nguồn: [time-keeping-test-cases.md](../screens/time-keeping/time-keeping-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có ít nhất 1 staff ở cột Unavailable
- **Bước:**
  1. Click vào thẻ staff ở cột Unavailable
  2. Bấm nút "Check In" xuất hiện
- **Kỳ vọng:** Toast "Check in successfully"; staff biến mất khỏi Unavailable, xuất hiện ở Available với nhãn "IN" + giờ hiện tại; badge 2 cột cập nhật
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TK-04 · Check Out một nhân viên

_Nguồn: [time-keeping-test-cases.md](../screens/time-keeping/time-keeping-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Staff đang ở cột Available (đã check-in)
- **Bước:**
  1. Click vào thẻ staff ở cột Available
  2. Bấm nút "Check Out" xuất hiện
- **Kỳ vọng:** Toast "Check out successfully"; staff quay lại cột Unavailable với nhãn "OUT" + giờ hiện tại
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-TURN-10 · Check In → nhân viên xuất hiện trên bảng Turn hôm nay

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Hôm nay chưa ai chấm công (bảng đang empty)
- **Bước:**
  1. Mở `?dialog=time-keeping` → Check In 1 nhân viên.
  2. Mở lại `?dialog=turn-board` (ngày = hôm nay).
- **Kỳ vọng:** Bảng có đúng 1 row = nhân viên vừa Check In; empty state biến mất.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-01 · Mở Turn từ sidebar

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang ở `/home`
- **Bước:**
  1. Bấm `button "Open sidebar"`.
  2. Bấm `button "Turn"` (exact) trong `dialog "Sidebar"`.
- **Kỳ vọng:** Sidebar đóng; URL = `/home?dialog=turn-board`; `dialog "Turn"` hiện với `heading "Turn"`.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-14 · Sort "Fewest turns first" đúng

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ngày có ≥2 nhân viên với turn khác nhau (27/07/2026)
- **Bước:** Quan sát thứ tự row.
- **Kỳ vọng:** Turn tăng dần từ trên xuống (vd 0, 0, 0, 0, 0.46, 4.24); các row cùng giá trị giữ thứ tự theo tên.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-34 · Chỉ order successful được tính turn

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ngày có nhân viên vừa có order successful vừa có pending/canceled (Pamela 13/08)
- **Bước:** Bật service-based + decimals, Turn value `$100.00`, xem row của nhân viên đó.
- **Kỳ vọng:** Turn = tổng service price của **order successful** / turn value (Pamela: $362.34 → `3.62`); tiền của order pending/canceled/cancel_issue bị loại.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-29 · Lưu Turn value mới → bảng tính lại ngay

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ngày đang chọn có nhân viên turn > 0 (Angela 4.24 @ $100)
- **Bước:** Mở Turn Settings → `fill('2500')` → `button "Save"`.
- **Kỳ vọng:** Dialog Settings đóng (không toast); giá trị turn nhân 4 tương ứng ($100 → $25): 4.24 → `16.96`, 0.46 → `1.84`; không cần reload.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-44 · Adjust Manual Turn: Save trên bảng hôm nay

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ngày = hôm nay, row Pamela `Current: 3.62`
- **Bước:**
  1. Bấm `+` (→ 4.62).
  2. Bấm `button "Save"` của row đó.
- **Kỳ vọng:** `Current: 4.62`; giá trị pending = 4.62; Save/Reset trở lại `[disabled]`; bảng Turn phía sau hiện `4.62 Turns`. Không có toast (đừng assert toast).
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TURN-52 · Quick View hiện đúng dữ liệu hôm nay

_Nguồn: [turn-test-cases.md](../screens/turn/turn-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Hôm nay có ≥1 row (vd Aubrey 1.02, Pamela 3.62)
- **Bước:** Bấm tab nổi `button "Turn"`.
- **Kỳ vọng:** Popover mở với `paragraph "Turn Order"` + các row hạng/avatar/tên/giá trị trùng đúng bảng turn hôm nay; `aria-expanded="true"` trên tab.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TT-05 · Time Tracking: thêm bản ghi thành công

_Nguồn: [time-tracking-test-cases.md](../screens/time-tracking/time-tracking-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã unlock
- **Bước:**
  1. Bấm nút Add cạnh ô search
  2. Chọn 1 Staff từ combobox
  3. Giữ nguyên Date IN mặc định (now), để trống Date OUT
  4. Bấm "Add"
- **Kỳ vọng:** Toast "Time keeping added successfully"; dialog đóng; bảng xuất hiện row mới đúng Staff vừa chọn, Date OUT = "-", Total Hours = "—", Created At = Updated At = thời điểm submit
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TT-07 · Time Tracking: xoá bản ghi thành công

_Nguồn: [time-tracking-test-cases.md](../screens/time-tracking/time-tracking-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã có 1 bản ghi
- **Bước:**
  1. Bấm "Delete" trên row
  2. Trong alertdialog xác nhận, bấm "Delete"
- **Kỳ vọng:** Alertdialog hiện đúng tên Staff trong message; sau khi confirm → toast "Time Keeping record deleted successfully"; row biến mất khỏi bảng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 10. Báo cáo / Income / Payroll — [income-daily](../screens/income-daily/income-daily-test-cases.md), [income-summary](../screens/income-summary/income-summary-test-cases.md), [income-staff](../screens/income-staff/income-staff-test-cases.md), [staff-payroll](../screens/staff-payroll/staff-payroll-test-cases.md), [batch-history](../screens/batch-history/batch-history-test-cases.md), [reports-v4](../screens/reports-v4/reports-v4-test-cases.md)

### ⭐ TC-32 (Daily) · Mở báo cáo phải nhập passcode trước

_Nguồn: [income-daily-test-cases.md](../screens/income-daily/income-daily-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Chưa mở passcode
- **Bước:** Mở route
- **Kỳ vọng:** Dialog passcode chặn data
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-1 (Daily) · Mặc định Today, layout đầy đủ

_Nguồn: [income-daily-test-cases.md](../screens/income-daily/income-daily-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Passcode đã mở
- **Bước:** Mở /incomes/income-daily
- **Kỳ vọng:** URL có `from=<today midnight>`; 4 card + panel hiển thị
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-18 (Daily) · Mỗi dòng: Total = Sale + Tip + Tax

_Nguồn: [income-daily-test-cases.md](../screens/income-daily/income-daily-test-cases.md)_

- **Bước:** Đọc từng dòng
- **Kỳ vọng:** Đẳng thức đúng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-24 (Daily) · Payment buckets Card / Cash / Others đúng

_Nguồn: [income-daily-test-cases.md](../screens/income-daily/income-daily-test-cases.md)_

- **Bước:** Đọc Payment Details
- **Kỳ vọng:** Khớp GraphQL
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-2/4/6/8 (Daily) · Refund / Cancel: Sale / Total âm, Cancel không vào Sale

_Nguồn: [income-daily-test-cases.md](../screens/income-daily/income-daily-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ngày có refund/cancel
- **Bước:** Đọc bảng + panel
- **Kỳ vọng:** Refund là số âm; order Cancel loại khỏi Sale/Tip
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-INCSUM-09 · Income Summary: Total Payment = Amount Collected + GC Redemption

_Nguồn: [income-summary-test-cases.md](../screens/income-summary/income-summary-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã mở chi tiết
- **Bước:** Cộng 2 giá trị
- **Kỳ vọng:** Bằng Total Payment
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-INCSUM-10 · Net Total = Subtotal − Discount + Service Fee − Cash Discount …

_Nguồn: [income-summary-test-cases.md](../screens/income-summary/income-summary-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã mở chi tiết
- **Bước:** Tính lại
- **Kỳ vọng:** Khớp tới cent
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-INCSUM-13 · Staff Payout: Pay 1 + Pay 2 = Total

_Nguồn: [income-summary-test-cases.md](../screens/income-summary/income-summary-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã mở chi tiết
- **Bước:** Cộng
- **Kỳ vọng:** Khớp
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-IST-04 · Staff Income: thanh tổng đủ 6 chỉ số

_Nguồn: [income-staff-test-cases.md](../screens/income-staff/income-staff-test-cases.md)_

- **Bước:** Đọc header stats
- **Kỳ vọng:** Total staff, Total orders, Total subtotal, Total supply fee, Total tip, Total staff income đều hiển thị
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-IST-16 · Staff Income chi tiết Commission tính đúng

_Nguồn: [income-staff-test-cases.md](../screens/income-staff/income-staff-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Staff kiểu Commission
- **Bước:** Đọc panel
- **Kỳ vọng:** Đẳng thức đúng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-IST-17 · Staff Income chi tiết Salary tính đúng

_Nguồn: [income-staff-test-cases.md](../screens/income-staff/income-staff-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Staff kiểu Salary
- **Bước:** Đọc panel
- **Kỳ vọng:** Đẳng thức đúng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-03 / TC-04 (Payroll) · Staff Payroll: số dòng và tổng cột khớp thanh tổng

**TC-03** — Số dòng bảng khớp thống kê Tổng nhân viên

_Nguồn: [staff-payroll-test-cases.md](../screens/staff-payroll/staff-payroll-test-cases.md)_

- **Bước:** Đọc chỉ số `Total staff` so với số lượng `tbody tr`
- **Kỳ vọng:** Bằng nhau (26 ở mọi kỳ đã quét)

**TC-04** — Tổng cột khớp với thanh tổng hợp

_Nguồn: [staff-payroll-test-cases.md](../screens/staff-payroll/staff-payroll-test-cases.md)_

- **Bước:** Cộng tổng các cột `Orders`/`Subtotal`/`Supply Fee`/`Tip` trên toàn bộ dòng
- **Kỳ vọng:** Bằng đúng thẻ thống kê tương ứng (xem các bảng theo kỳ bên dưới)

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-10 (Payroll) · Staff Payroll POS khớp Portal cùng kỳ

_Nguồn: [staff-payroll-test-cases.md](../screens/staff-payroll/staff-payroll-test-cases.md)_

- **Bước:** Với cùng một `periodId`, so sánh từng dòng (Tên, Đơn hàng, Tổng tiền hàng, Phí Supply, Tip, Tổng thu nhập) giữa `localhost:1420/incomes/staff-payroll` và tab `staff-payroll` bên Portal
- **Kỳ vọng:** Cả 26 dòng nhân viên và 6 chỉ số tổng hợp khớp chính xác giữa hai app
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-BATCH-05 · Batch đang mở hiển thị đúng

_Nguồn: [batch-history-test-cases.md](../screens/batch-history/batch-history-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có batch chưa đóng
- **Bước:** Đọc dòng có Status Open
- **Kỳ vọng:** Batch Date = "Not closed yet", Total Amount có dạng tiền `$x,xxx.xx`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-BATCH-07 · Mở Batch Close Review

_Nguồn: [batch-history-test-cases.md](../screens/batch-history/batch-history-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Có ít nhất 1 batch
- **Bước:** Bấm nút Total Amount của dòng đầu
- **Kỳ vọng:** Panel hiện "Batch Close Review", trạng thái của batch, bảng OD Code/Subtotal/Tip/Total có ≥ 1 dòng
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-RV4-06 · Daily Sale Report V4 khớp V1 cùng ngày

_Nguồn: [reports-v4-test-cases.md](../screens/reports-v4/reports-v4-test-cases.md)_

- **Bước:** So Sale/Tip/Total Payment V4 với `/incomes/income-daily`
- **Kỳ vọng:** Bằng nhau
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-RV4-07 · Income Summary V4 khớp V1

_Nguồn: [reports-v4-test-cases.md](../screens/reports-v4/reports-v4-test-cases.md)_

- **Bước:** So dòng Today của 2 bản
- **Kỳ vọng:** Sale/Tip/Tax/Total Payment bằng nhau
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-RV4-13 · Staff Income V4 khớp V1

_Nguồn: [reports-v4-test-cases.md](../screens/reports-v4/reports-v4-test-cases.md)_

- **Bước:** So card tổng V4 với `/incomes/income-staff` cùng ngày
- **Kỳ vọng:** Total orders/subtotal/supply/tip bằng nhau
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 11. Receipt — [receipt](../screens/receipt/receipt-test-cases.md)

### ⭐ TC-RCP-01 · Settings › Receipt render 4 section + preview

_Nguồn: [receipt-test-cases.md](../screens/receipt/receipt-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã đăng nhập, DB đã sync
- **Bước:** Goto `/settings/receipt`
- **Kỳ vọng:** `heading` "Receipt Setting" và "Receipt Preview"; 4 nút section `Printing Preference`, `Logo & Branding`, `Receipt Message`, `Display Options` đều `aria-expanded="true"`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-RCP-09 · Tắt Display Option → preview cập nhật ngay

_Nguồn: [receipt-test-cases.md](../screens/receipt/receipt-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Vừa mở màn
- **Bước:** Click `#customer-info`
- **Kỳ vọng:** `aria-checked="false"`; chuỗi `Customer Name` **mất khỏi preview** ngay, không cần Save; `Save` enabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-RCP-12 · Thay đổi không Save bị bỏ sau reload

_Nguồn: [receipt-test-cases.md](../screens/receipt/receipt-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã tắt `#customer-info`, chưa Save
- **Bước:** Reload route
- **Kỳ vọng:** `#customer-info` về `true`; `Save` disabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ (Order History) · In / gửi receipt 1 đơn thật: số tiền, tax, tip, chữ ký, Auth Code đúng

_Test tay — không có TC gốc trong docs/screens_

- **Tiền điều kiện / dữ liệu:** Có 1 đơn Card đã thanh toán, có tip và chữ ký khách
- **Bước:**
  1. Order History → mở đơn → Receipt
  2. Xem preview, bấm Print (hoặc gửi SMS / Email)
- **Kỳ vọng:** Receipt đúng tên tiệm, SĐT tiệm, item, Subtotal, Tax, Tip, Total, phương thức trả; đơn Card có Auth Code và chữ ký khách.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 12. Settings — [settings](../screens/settings/settings-test-cases.md) và các màn con

### ⭐ TC-SETTINGS-02 · Passcode chặn vào Settings khi chưa xác thực

_Nguồn: [settings-test-cases.md](../screens/settings/settings-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Chưa tick "Do not require passcode..."
- **Bước:** Navigate trực tiếp tới `/settings/business` (URL mới, chưa qua gate).
- **Kỳ vọng:** `dialog "Enter staff code to access Merchant Settings Page"` hiện, nội dung Business Info chưa hiển thị.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SETTINGS-05 · Sidebar đủ 6 nhóm mục

_Nguồn: [settings-test-cases.md](../screens/settings/settings-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã qua gate passcode, đang ở `/settings/business`
- **Bước:** Snapshot sidebar navigation.
- **Kỳ vọng:** Có đủ: Business Info; Services & Products; Employees, Roles, Permissions; Receipt, Charge & Fee; Tipping Settings, Payment Gateway; Accessibility, Language.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-BIZ-02 · Business Info: unlock bằng passcode đúng

_Nguồn: [settings-business-test-cases.md](../screens/settings-business/settings-business-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** dialog đang hiện
- **Bước:**
  1. Tick "30 phút"
  2. Nhập `8888`
- **Kỳ vọng:** Dialog đóng, form Business Info hiện
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SVC-03 · Services: tab Active liệt kê category đang bật

_Nguồn: [settings-services-test-cases.md](../screens/settings-services/settings-services-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở `/settings/services`
- **Bước:** Tab Active đang selected
- **Kỳ vọng:** `tabpanel` Active có ≥1 `link` category, mỗi link kèm nút `Update`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SVC-18 · Dialog Add New Item (service) đủ field

_Nguồn: [settings-services-test-cases.md](../screens/settings-services/settings-services-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang mở category dịch vụ
- **Bước:** Click `+` ở header chi tiết
- **Kỳ vọng:** `heading` "Add New Item"; có `Service Name`, `Category Name` (prefill category đang mở), `Service Price`, checkbox `Flexible Pricing`, `Service Duration` (2 combobox `0 hours`/`0 mins`), `Supply Fee`, `Service Description`; 4 switch Visibility: `Active`, `Shown on Web Booking`, `Shown on Go Checkin`, `Shown on Go POS` — tất cả ON; nút `Add` disabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-SVC-23 · Update Service prefill đúng + gate dirty

_Nguồn: [settings-services-test-cases.md](../screens/settings-services/settings-services-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang mở category dịch vụ
- **Bước:** Click `Edit` dòng đầu (`Regular Toe Polish Change`)
- **Kỳ vọng:** `heading` "Update Service"; name/price/supplyFee prefill đúng (`$20.00`, `$1.00`); `Flexible Pricing` unchecked; nút `Update` disabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ TC-EMP-08 · Staffs: click nhân viên mở chi tiết

_Nguồn: [settings-staffs-test-cases.md](../screens/settings-staffs/settings-staffs-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở `/settings/staffs`
- **Bước:** Click 1 nhân viên
- **Kỳ vọng:** URL = `/settings/staffs/<uuid>`; `heading` level 3 = nickname; `Save` disabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-EMP-12 · Tab Compensation có 3 chế độ lương

_Nguồn: [settings-staffs-test-cases.md](../screens/settings-staffs/settings-staffs-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang xem 1 nhân viên
- **Bước:** Click tab `Compensation`
- **Kỳ vọng:** Thấy `Commission`, `Commission + Salary`, `Salary`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-EMP-23 · Sửa field làm dirty và bật Save

_Nguồn: [settings-staffs-test-cases.md](../screens/settings-staffs/settings-staffs-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Tab Information active
- **Bước:** Fill `#city` = `QA City`
- **Kỳ vọng:** `Save` enabled. **Không Save — reload để bỏ thay đổi**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-ROLE-05 · Roles: click vai trò → chi tiết

_Nguồn: [settings-roles-test-cases.md](../screens/settings-roles/settings-roles-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Ở `/settings/roles`
- **Bước:** Click `Partner`
- **Kỳ vọng:** URL = `/settings/roles/<uuid>`; item được active; bảng nhân viên render
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-ROLE-15 · Tick nhân viên bật nút Assign

_Nguồn: [settings-roles-test-cases.md](../screens/settings-roles/settings-roles-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã lọc còn 1 item
- **Bước:** Click checkbox của item
- **Kỳ vọng:** `aria-checked="true"`; nút `Assign` enabled
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-PERM-10 · Permissions: cột Owner luôn bật, không sửa được

_Nguồn: [settings-permissions-test-cases.md](../screens/settings-permissions/settings-permissions-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã Expand All
- **Bước:** Với mỗi dòng, đọc switch index 0
- **Kỳ vọng:** Tất cả `aria-checked="true"` **và** `disabled`
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-PERM-12 · Bật quyền cha cascade sang quyền con

_Nguồn: [settings-permissions-test-cases.md](../screens/settings-permissions/settings-permissions-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã Expand All; `Partner`/`Cash Drawer` = OFF
- **Bước:** Click switch `Partner` ở dòng `Cash Drawer`
- **Kỳ vọng:** Cha `Cash Drawer` → ON **và** con `Open Cash Drawer` cột Partner cũng → ON
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-PERM-16 · Thay đổi quyền còn sau reload

_Nguồn: [settings-permissions-test-cases.md](../screens/settings-permissions/settings-permissions-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Vừa toggle 1 switch
- **Bước:**
  1. Reload route
  2. Đọc lại dòng đó
- **Kỳ vọng:** Giá trị đúng như sau khi toggle ⇒ đã lưu server-side
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-TIP-10 / TC-TIP-12 · Payment & transaction: Save toast + giá trị còn sau reload (nhớ trả về `Split Evenly`)

**TC-TIP-10** — Save hiện toast thành công

_Nguồn: [settings-payment-transaction-test-cases.md](../screens/settings-payment-transaction/settings-payment-transaction-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã chọn `Proportion`
- **Bước:** Click `Save`
- **Kỳ vọng:** Toast **"Split tip setting updated"**

**TC-TIP-12** — Giá trị đã lưu sống qua reload

_Nguồn: [settings-payment-transaction-test-cases.md](../screens/settings-payment-transaction/settings-payment-transaction-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Vừa Save `Proportion`
- **Bước:** Reload route
- **Kỳ vọng:** `Proportion` `aria-checked="true"` ⇒ lưu server-side, không phải local

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-PGW-05 / TC-PGW-08 · Payment Gateway: tắt switch áp ngay, còn sau reload (nhớ bật lại)

**TC-PGW-05** — Tắt switch cập nhật ngay, không cần Save

_Nguồn: [settings-payment-gateway-test-cases.md](../screens/settings-payment-gateway/settings-payment-gateway-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Switch đang ON
- **Bước:** Click switch
- **Kỳ vọng:** `aria-checked = "false"`; không có nút Save nào trên màn

**TC-PGW-08** — OFF giữ nguyên sau reload

_Nguồn: [settings-payment-gateway-test-cases.md](../screens/settings-payment-gateway/settings-payment-gateway-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Vừa tắt switch
- **Bước:** Reload `/settings/payment-gateway`
- **Kỳ vọng:** `aria-checked = "false"`

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-PASSCODE-02 / 03 · Accessibility: tắt / bật Passcode Verification

**TC-PASSCODE-02** — Tắt Passcode Verification ẩn modal passcode trên route gated

_Nguồn: [settings-accessibility-test-cases.md](../screens/settings-accessibility/settings-accessibility-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đang ở `/settings/accessibility`, switch đang ON
- **Bước:**
  1. Click switch để tắt (OFF)
  2. Điều hướng tới `/settings/business` (route gated)
- **Kỳ vọng:** Không có `dialog "Enter your passcode"`; nội dung Business Info hiện ngay lập tức

**TC-PASSCODE-03** — Bật lại Passcode Verification hiện lại modal passcode

_Nguồn: [settings-accessibility-test-cases.md](../screens/settings-accessibility/settings-accessibility-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Switch đang OFF (từ TC-02)
- **Bước:**
  1. Quay lại `/settings/accessibility`, click switch để bật lại (ON)
  2. Điều hướng tới `/settings/business`
- **Kỳ vọng:** `dialog "Enter your passcode"` hiển thị; nhập đúng `OWNER_PASSCODE` (8888) đóng dialog và vào được Business Info

- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

## 13. Hệ thống (test tay)

### ⭐ Smoke · Mở app, đăng nhập passcode, vào Home không lỗi

_Test tay — không có TC gốc trong docs/screens_

- **Bước:**
  1. Mở app Volt POS
  2. Nhập passcode đăng nhập
  3. Vào Home
- **Kỳ vọng:** Splash qua bình thường, không trắng màn; Home hiện Staff / Service / Cart; không có popup lỗi.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ Version Update · Menu ≡ → Version Update hiện đúng version build đang test

_Test tay — không có TC gốc trong docs/screens_

- **Bước:** Menu ≡ → Version Update
- **Kỳ vọng:** Version hiển thị đúng build đang test; kiểm tra cập nhật không báo lỗi.
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### TC-HOME-VI-01 · Đổi ngôn ngữ sang Tiếng Việt qua UI

_Nguồn: [home-test-cases.md](../screens/home/home-test-cases.md)_

- **Tiền điều kiện / dữ liệu:** Đã đăng nhập
- **Bước:**
  1. Settings → Language
  2. Chọn Tiếng Việt
  3. Quay về Home
- **Kỳ vọng:** Giao diện chuyển sang tiếng Việt, sidebar hiện "Đơn đang chờ"; nhớ đổi lại English sau khi test nếu tiệm dùng English
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

---

## 14. Đồng bộ POS ↔ DTS (Staff, Category, Service, Appointment, Customer, Point)

> 10/11: dev báo các luồng này đang hoạt động bình thường (trừ Checkin Today — xem PEND-041). Kiểm tra cả 2 chiều nếu DTS cho sửa: làm trên POS → xem DTS, và làm trên DTS → xem POS (không restart POS, chờ tối đa 60 giây).
> Dùng dữ liệu test riêng (tên bắt đầu bằng `QA-SYNC`), xong thì xoá / trả lại như cũ.

### ⭐ SYNC-01 · Tạo Staff POS ↔ DTS

_Nguồn: [01-khoi-dong-dang-nhap-dieu-huong.md](volt-qc/windows-regression/01-khoi-dong-dang-nhap-dieu-huong.md)_

- **Bước:**
  1. POS: Settings › Staffs → **Create New Staff** (nickname `QA-SYNC`, staff code 4 số) → Save
  2. Mở DTS (Admin), tìm staff vừa tạo
- **Kỳ vọng:**
  - DTS: staff `QA-SYNC` xuất hiện đúng tên, code, trạng thái
  - POS: `QA-SYNC` có trong Home staff list và Time Keeping
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-02 · Sửa Staff POS ↔ DTS

_Nguồn: [01-khoi-dong-dang-nhap-dieu-huong.md](volt-qc/windows-regression/01-khoi-dong-dang-nhap-dieu-huong.md)_

- **Bước:**
  1. POS: Settings › Staffs › `QA-SYNC` → sửa nickname / số điện thoại / lương → Save
  2. Mở DTS (Admin), tìm staff vừa sửa
- **Kỳ vọng:**
  - DTS: thông tin mới khớp POS
  - POS: thông tin mới hiện ở Home staff list
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-03 · Xoá Staff POS ↔ DTS

_Nguồn: [01-khoi-dong-dang-nhap-dieu-huong.md](volt-qc/windows-regression/01-khoi-dong-dang-nhap-dieu-huong.md)_

- **Bước:**
  1. POS: Settings › Staffs › `QA-SYNC` → xoá staff (hoặc chuyển Inactive nếu POS không có nút xoá)
  2. Mở DTS (Admin), tìm staff vừa xoá
- **Kỳ vọng:**
  - DTS: staff bị xoá / Inactive
  - POS: staff biến mất khỏi Home và Time Keeping; nhập staff code cũ ở cổng passcode báo **Failed to verify staff code**
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-04 · Tạo Category POS ↔ DTS

- **Bước:**
  1. POS: Settings › Services → **Create Category** `QA-SYNC Cat` → Create
  2. Mở DTS (Admin), tìm category vừa tạo
- **Kỳ vọng:**
  - DTS: category mới xuất hiện
  - POS: category mới có trong lưới category ở Home
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-05 · Sửa Category POS ↔ DTS

- **Bước:**
  1. POS: Settings › Services › `QA-SYNC Cat` → đổi tên → Save
  2. Mở DTS (Admin), tìm category vừa sửa
- **Kỳ vọng:**
  - DTS: tên mới khớp POS
  - POS: tên mới hiện ở Home
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-06 · Xoá Category POS ↔ DTS

- **Bước:**
  1. POS: Settings › Services › `QA-SYNC Cat` → xoá category (category rỗng)
  2. Mở DTS (Admin), tìm category vừa xoá
- **Kỳ vọng:**
  - DTS: category bị xoá
  - POS: category biến mất khỏi Home
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ SYNC-07 · Tạo Service POS ↔ DTS

_Nguồn: [01-khoi-dong-dang-nhap-dieu-huong.md](volt-qc/windows-regression/01-khoi-dong-dang-nhap-dieu-huong.md)_

- **Bước:**
  1. POS: Settings › Services › `QA-SYNC Cat` → **Add New Item** `QA-SYNC Service` giá $10.00 → Save
  2. Mở DTS (Admin), tìm service vừa tạo
- **Kỳ vọng:**
  - DTS: service mới đúng tên, giá, category
  - POS: service có trong category ở Home, giá $10.00, thêm vào cart được
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-08 · Sửa Service POS ↔ DTS

_Nguồn: [01-khoi-dong-dang-nhap-dieu-huong.md](volt-qc/windows-regression/01-khoi-dong-dang-nhap-dieu-huong.md)_

- **Bước:**
  1. POS: Settings › Services › `QA-SYNC Service` → đổi giá $10.00 → $12.00 → Save
  2. Mở DTS (Admin), tìm service vừa sửa
- **Kỳ vọng:**
  - DTS: giá $12.00
  - POS: card service ở Home hiện $12.00, không cần restart
  - Trả giá về $10.00 → cả 2 bên về $10.00
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-09 · Xoá Service POS ↔ DTS

- **Bước:**
  1. POS: Settings › Services › `QA-SYNC Service` → xoá service
  2. Mở DTS (Admin), tìm service vừa xoá
- **Kỳ vọng:**
  - DTS: service bị xoá
  - POS: service biến mất khỏi Home
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ SYNC-10 · Lịch đặt online (booking) về POS không cần reload

_Nguồn: [08-appointment.md](volt-qc/windows-regression/08-appointment.md)_

- **Tiền điều kiện / dữ liệu:** POS mở màn Appointment, board hôm nay.
- **Bước:**
  1. Đặt 1 lịch online (GoBooking / DTS) hôm nay cho 1 staff test, giờ trong tương lai
  2. Không reload POS, chờ tối đa 60 giây
- **Kỳ vọng:**
  - Card lịch mới xuất hiện đúng cột staff, đúng giờ, đúng khách / dịch vụ
  - Badge header và **Appointments Today** tăng 1; có thông báo mới trên chuông
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-11 · Sửa / huỷ lịch online → POS cập nhật

_Nguồn: [08-appointment.md](volt-qc/windows-regression/08-appointment.md)_

- **Tiền điều kiện / dữ liệu:** Lịch ở SYNC-10.
- **Bước:**
  1. Đổi giờ lịch trên GoBooking / DTS, chờ sync
  2. Huỷ lịch trên GoBooking / DTS, chờ sync
- **Kỳ vọng:**
  - Sau bước 1: card chuyển đúng giờ mới
  - Sau bước 2: card biến mất (filter mặc định); badge và Appointments Today giảm 1
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ SYNC-12 · Tạo customer trên POS → DTS

- **Tiền điều kiện / dữ liệu:** SĐT mới chưa có trong hệ thống.
- **Bước:**
  1. POS Home: nhập SĐT mới → **Add new customer** → nhập tên `QA-SYNC Cust` → Save
  2. Mở DTS (Admin) tìm theo SĐT
- **Kỳ vọng:**
  - DTS có customer mới đúng tên, SĐT
  - Check-in GoCheckin bằng SĐT này nhận ra khách cũ ("welcome back")
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### SYNC-13 · Sửa customer → đồng bộ 2 chiều

- **Tiền điều kiện / dữ liệu:** Customer ở SYNC-12.
- **Bước:**
  1. POS: sửa tên / email / ngày sinh / group → Save, xem DTS
  2. DTS: sửa lại 1 field, xem POS (không restart)
- **Kỳ vọng:** Thông tin sau sửa khớp ở cả POS và DTS
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

### ⭐ SYNC-14 · Điểm (point) của khách đồng bộ POS ↔ DTS

_Nguồn: [04-khuyen-mai-diem-giftcard.md](volt-qc/windows-regression/04-khuyen-mai-diem-giftcard.md)_

- **Tiền điều kiện / dữ liệu:** Khách test có điểm; ghi lại số điểm trước khi test trên POS và DTS.
- **Bước:**
  1. POS: tạo order cho khách, thanh toán Cash → Complete (cộng điểm theo Point Config / Checkout Type)
  2. Xem điểm khách trên DTS
  3. DTS: chỉnh tay điểm khách (Update point) → xem lại POS ở ô khách và **Promo & Rewards**
- **Kỳ vọng:**
  - Bước 2: điểm trên DTS = điểm trước + điểm vừa cộng
  - Bước 3: POS hiện **Point: <số mới>**; reward đủ điểm hiện trong Promo & Rewards
- **Kết quả:** ☐ PASS ☐ FAIL ☐ BLOCKED · Ghi chú: ____________________

---

## Tổng kết lần chạy

| Nhóm                        | Số TC   | ⭐     | ✅  | ❌  | ⛔  | Bug (VP-xxxx) |
| --------------------------- | ------- | ------ | --- | --- | --- | ------------- |
| 1. Tạo order                | 9       | 4      |     |     |     |               |
| 2. Checkout                 | 11      | 5      |     |     |     |               |
| 3. Split Order              | 7       | 2      |     |     |     |               |
| 4. Order History            | 9       | 4      |     |     |     |               |
| 5. Order Pending & Check-in | 10      | 4      |     |     |     |               |
| 6. Reopen                   | 8       | 2      |     |     |     |               |
| 7. Điểm / Khách hàng        | 11      | 2      |     |     |     |               |
| 8. Appointment              | 4       | 1      |     |     |     |               |
| 9. Turn & Chấm công         | 11      | 2      |     |     |     |               |
| 10. Báo cáo                 | 18      | 4      |     |     |     |               |
| 11. Receipt                 | 4       | 2      |     |     |     |               |
| 12. Settings                | 17      | 2      |     |     |     |               |
| 13. Hệ thống                | 3       | 2      |     |     |     |               |
| 14. Đồng bộ POS ↔ DTS       | 14      | 5      |     |     |     |               |
| **Tổng**                    | **136** | **41** |     |     |     |               |
