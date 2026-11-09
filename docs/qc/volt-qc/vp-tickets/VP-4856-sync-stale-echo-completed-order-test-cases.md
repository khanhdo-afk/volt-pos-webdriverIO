---
title: Puller không được ghi đè echo cũ lên order vừa complete (successful → pending) — test cases
ticket: VP-4856 — https://linear.app/fastboy/issue/VP-4856/pos-puller-re-applies-a-stale-echo-over-a-just-completed-order-torn
sub-issues: —
spec-files: tests/regression/sync/vp-4856-stale-echo.spec.ts
imported-at: 2026-11-09
updated-at: 2026-11-09
---

# Test Cases – [POS] Puller re-applies a stale echo over a just-completed order (torn fence/queue read)

**Ticket:** [VP-4856](https://linear.app/fastboy/issue/VP-4856/pos-puller-re-applies-a-stale-echo-over-a-just-completed-order-torn) · project Maintenance 2026-Q4-M11-W1 · liên quan VP-3777, VP-3779, VP-4447
**Dev:** Nam Pham (`nam_pham`) · PR FastboyMarketing/volt-pos#3260 (merge `develop` 06/11/2026)
**Trạng thái:** QC Completed. Đã test tay trên dev 1.1.113 ngày 09/11/2026: 7/7 PASS (3 Card + 4 Cash).

## Hành vi mong đợi

1. Sau khi `completeOrder` (Card hoặc Cash, tip chọn trên customer display), order trong DB local của POS **giữ nguyên** `successful` + tip + khách. Echo cũ (`pending`) của lần push tip draft không được ghi đè lên order.
2. Echo mới hơn từ server (cùng `successful`) vẫn được áp: chỉ `updatedAt` đổi.
3. Lần ghi local tiếp theo trên order (vd Adjust Tip) push row mới, không bị server từ chối (`syncing-refused` / `status_regression`).
4. Gốc lỗi: puller đọc fence (`pushed_row_lsn`) và hàng đợi (`pushing_data`) bằng 2 câu lệnh riêng; DataPusher commit chen vào giữa. Fix: đọc trong **1 read transaction** (`refresh_superseding_state`). Code sync Rust dùng chung, nên áp cho cả Windows và Android.

## Điều kiện chung

- Môi trường DEV, merchant #14, POS Windows **≥ 1.1.113** (bản dev mới nhất trên feed, có PR #3260), cửa sổ khách `/customer/` mở.
- Khách có SĐT duy nhất: `VP4856_PHONE` (mặc định 2052051122 – Tuti). Thợ / dịch vụ: thợ + dịch vụ đầu tiên trên Home (`app.createOrder()`).
- Luồng **Card** cần terminal đã kết nối (máy test thường không có). Không có terminal thì Complete Payment ở tender Card bị khoá, TC Card tự **SKIP**. Bắt buộc chạy Card: `VP4856_REQUIRE_CARD=1` (thiếu terminal thì FAIL thay vì SKIP).
- Passcode staff 8888 (30 phút) cho Quick Checkout / Adjust Tip.
- Oracle DB local: GraphQL `orderList(where:{orderCode:{eq}}){status tipAmount customerId updatedAt completedAt total}`. Một watcher trong trang đọc order mỗi 300 ms từ trước khi Pay tới hết thời gian theo dõi (40 s sau complete, 30 s sau Adjust Tip).
- Chỉ luồng Card ghi **tip draft** (order còn `pending` nhưng `updatedAt` nhảy) trước khi complete: đây là điều kiện của case prod. Cash không có bước này.

Chú thích trạng thái: ✅ tự động được · ⚠️ tự động được, có điều kiện · 🧱 chưa tự động được ở đây (lý do) · 📄 chỉ tài liệu · 🐞 VP-xxxx bug đã log.

## 1. Thanh toán Card, tip chọn trên customer display (đúng kịch bản prod)

| TC ID        | Title                                                    | Priority | Precondition        | Test Data                   | Steps                                                                                                                                                         | Expected Result                                                                                                                                                        | Status |
| ------------ | -------------------------------------------------------- | -------- | ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP4856-01 | Card + tip trên customer display: order không về pending | Critical | Terminal đã kết nối | Khách VP4856_PHONE, tip 15% | 1. Tạo order, gắn khách (Yes). 2. Pay → Card → Complete Payment. 3. Khách chọn 15% → Continue. 4. Terminal duyệt, khách ký → Continue. 5. Theo dõi order 40 s | Watcher thấy tip draft khi còn `pending`; từ lúc `successful` trở đi mọi lần đọc đều `successful`, `tipAmount` = tip trên màn Payment Successful, `customerId` = khách | ⚠️     |
| TC-VP4856-02 | Card: Adjust Tip sau khi complete                        | High     | Terminal đã kết nối | Tip mới $6.00               | 1. Như TC-01 tới Payment Successful. 2. Adjust Tip → 600 → Save. 3. Theo dõi 30 s                                                                             | Order vẫn `successful`, `tipAmount` = 600, không có lần đọc nào `pending`                                                                                              | ⚠️     |
| TC-VP4856-03 | Card lặp lại nhiều lần liên tiếp                         | High     | Terminal đã kết nối | Tip 20%, 10%                | Lặp TC-01 hai lần liên tiếp                                                                                                                                   | Cả 2 order giữ `successful` + tip + khách trong 40 s sau complete                                                                                                      | ⚠️     |

## 2. Thanh toán Cash, tip chọn trên customer display (hồi quy)

| TC ID        | Title                             | Priority | Precondition | Test Data                   | Steps                                                                                                     | Expected Result                                                        | Status |
| ------------ | --------------------------------- | -------- | ------------ | --------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| TC-VP4856-04 | Cash + tip trên customer display  | High     | —            | Khách VP4856_PHONE, tip 15% | 1. Tạo order, gắn khách. 2. Pay → Cash → Complete Payment. 3. Khách chọn 15% → Continue. 4. Theo dõi 40 s | Từ lúc `successful` mọi lần đọc đều `successful`, đúng tip, đúng khách | ✅     |
| TC-VP4856-05 | Cash: Adjust Tip sau khi complete | Medium   | —            | Tip mới $5.00               | 1. Như TC-04 tới Payment Successful. 2. Adjust Tip → 500 → Save. 3. Theo dõi 30 s                         | Order vẫn `successful`, `tipAmount` = 500                              | ✅     |
| TC-VP4856-06 | Cash lặp lại nhiều lần liên tiếp  | Medium   | —            | Tip 20%, 10%                | Lặp TC-04 hai lần liên tiếp                                                                               | Cả 2 order giữ `successful` + tip + khách                              | ✅     |

## 3. Order History

| TC ID        | Title                                              | Priority | Precondition      | Test Data                | Steps                               | Expected Result                                             | Status |
| ------------ | -------------------------------------------------- | -------- | ----------------- | ------------------------ | ----------------------------------- | ----------------------------------------------------------- | ------ |
| TC-VP4856-07 | Order History hiện các order vừa trả là Successful | Medium   | Đã chạy TC-01..06 | Các order vừa thanh toán | Mở Order History, tìm từng mã order | Mỗi order hiện "Successful", DB local `status = successful` | ✅     |

## Ghi chú automation

- TC-01..03 SKIP khi không có terminal (Complete Payment ở tender Card bị khoá). Kết quả tay 09/11 trên 1.1.113: PASS cả 3.
- Spec tạo order thật và thanh toán. Chỉ chạy dev / staging.
- Chạy tự động 09/11/2026 trên dev 1.1.113, có terminal: **7/7 PASS** (TC-01..07). TC-02, TC-05 pass ở lần chạy lại sau khi sửa helper Adjust Tip.
- Chạy bằng `npm run test:spec` (harness tự mở app). Lane attach (`test:attach`) đang hỏng trên máy này: WebView2 157 vs msedgedriver 156, gắn session vào thì cửa sổ chính bị chuyển thành `about:blank`.
- Adjust Tip trên màn Payment Successful không dùng `app.adjustTip`: probe passcode dùng chung nhận nhầm bàn phím Adjust Tip là ô passcode. Bàn phím mở sẵn tip hiện tại, phải xoá về $0.00 trước khi nhập.
