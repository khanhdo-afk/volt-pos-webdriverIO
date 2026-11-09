---
title: Re-Open → complete lại không thu hồi điểm cũ (cộng chồng) — test cases
ticket: VP-5293 — https://linear.app/fastboy/issue/VP-5293/pos-windows-1168-re-open-edit-order-complete-lai-djoi-khi-khong-thu
sub-issues: —
spec-files: tests/regression/checkout-type/vp-5293-reopen-recomplete-points.spec.ts
imported-at: 2026-11-08
updated-at: 2026-11-08
---

# Test Cases – [POS Windows 1.1.68] Re-Open → Edit Order → complete lại: đôi khi KHÔNG thu hồi điểm cũ, khách bị cộng chồng

**Ticket:** [VP-5293](https://linear.app/fastboy/issue/VP-5293/pos-windows-1168-re-open-edit-order-complete-lai-djoi-khi-khong-thu) · project "Reopen order — update item & staff" · liên quan VP-4980, VP-3984, VP-2585, VP-4591
**Dev:** Nam Pham (`nam_pham`) · PR FastboyMarketing/volt-pos#3368 (vào `develop` 06/11, có trong 1.1.109) — chặn đọc order cũ từ cache khi re-complete + log/Sentry những gì gửi đi
**Trạng thái:** QC Completed 07/11/2026 trên dev 1.1.109. Chạy lại tự động 08/11/2026 00:27–00:35 trên 1.1.109 (bản mới nhất trên feed): **9 PASS / 0 FAIL / 3 PENDING** (TC-09/12 chạy 01:54–01:58).

| TC           | Kết quả 08/11 | Ghi chú                                                                                                                                                                                                                           |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-VP5293-01 | ✅ PASS       | Đơn A + A2, mỗi đơn $63 Cash +63 (3864 → 3990), `pointBonus` 63                                                                                                                                                                   |
| TC-VP5293-11 | ✅ PASS       | OD261108-62895750, re-open đầu tiên sau khi mở app + thêm Dark Queen: $168, điểm 3990 → 4095 (−63 +168)                                                                                                                           |
| TC-VP5293-02 | ✅ PASS       | OD261108-62868167 (app vừa mở lại): Zelene Doyle → Pamela, $63 giữ, điểm 4095 → 4095                                                                                                                                              |
| TC-VP5293-03 | ✅ PASS       | Log: `sent nothing: previous pointBonus 63, owner stamp present, customer present`                                                                                                                                                |
| TC-VP5293-04 | ✅ PASS       | OD261108-63068155 sau reload webview: 4158 → 4158                                                                                                                                                                                 |
| TC-VP5293-05 | ✅ PASS       | OD261108-63148524 cùng phiên: 4221 → 4221                                                                                                                                                                                         |
| TC-VP5293-06 | ✅ PASS       | OD261108-63229158 cùng phiên + thêm Dark Queen: $168, 4284 → 4389 (−63 +168), log `award 168`, `pointBonus` 168                                                                                                                   |
| TC-VP5293-09 | ✅ PASS       | 01:54 spec tự đổi Portal → Hybrid. OD261108-68084477: $63 +63, thêm Dark Queen → $168, 4452 → 4557 (−63 +168), log `award 168`                                                                                                    |
| TC-VP5293-12 | ✅ PASS       | 01:56 spec tự đổi Portal → Auto (Point Bonus 10). OD261108-68171374: +10, thêm Dark Queen → $168, điểm giữ 4567, `pointBonus` 10, log `sent nothing: previous pointBonus 10, owner stamp present`. Portal trả về Manual lúc 01:58 |

## Hành vi mong đợi

1. Complete lại sau Re-Open: POS gửi `pointBonus` (điểm lần đầu) + `oldCustomerId` → API **thu hồi điểm cũ** rồi cộng theo tổng mới (rule VP-4980: cùng khách, 63 → 80 = −63, +80).
2. Đúng cả ở lần re-open **đầu tiên ngay sau khi mở app** (đơn lỗi gốc OD261030-34659021 bị +63 rồi +168, không có Revoke).
3. Re-Open trên 1.1.109 vẫn cho **sửa item / giá 1 lần** (dialog: "One edit of items, prices left; locks once paid"). Phải **chọn thợ trước** rồi mới bấm dịch vụ, không thì hiện "Select Staff First".
   - Thêm dịch vụ → checkout đòi phần còn lại (vd Cash $105) → trả xong là hoàn tất (không cần Re-Open Done). Điểm: −điểm cũ + điểm theo tổng mới, `pointBonus` = điểm mới.
   - Chỉ đổi thợ → tổng không đổi → điểm khách **giữ nguyên**, `pointBonus` giữ nguyên, POS không gửi gì (`sent nothing`).
   - Editor re-open hiện giá thẻ (vd $61.13 / $101.87, Total $171.15); checkout vẫn tính Cash theo giá cash ($168) — dual pricing, không phải lỗi.
4. Mỗi lần re-complete POS ghi 1 dòng log `[checkinAndCheckout] re-complete of order <id> …` (warn). Dòng chứa `pointBonus none` + `owner stamp present` = dấu hiệu cộng chồng (đồng thời gửi Sentry `recomplete_points`).
5. Re-open mà không đọc lại được order mới (fetch lỗi) → POS **từ chối** complete, không ghi gì, thu ngân bấm complete lại.

## Điều kiện chung

- Môi trường DEV, merchant #14, POS Windows **≥ 1.1.109** (có PR #3368), attach CDP 9222.
- Portal Point Config: Checkout type = Manual (`payment_method`), Cash $1 = 1 điểm.
- Khách có điểm: `LOYALTY_CUSTOMER_PHONE` (configs/env/.env.dev, hiện 8322280593 – QC Coby 334334).
- Đơn: staff tile đầu + service đầu (Lidasy $60 + tax = $63), Cash.
- Oracle: số dư GoCheckin `customerInfo(phone).currentPoint`, `order.pointBonus` qua GraphQL POS, log POS `%LOCALAPPDATA%\VoltPOS\logs\<yyyy-MM-dd>.log`.
- Biến env: `VP5293_PHASE` = `pay` | `reopen` (mặc định `reopen`). State giữa 2 pha: `.tmp/vp5293.json`.

Chú thích trạng thái: ✅ tự động được · ⚠️ tự động được, có điều kiện · 🧱 chưa tự động được (lý do) · 📄 chỉ tài liệu · 🐞 bug đã log.

## 1. Re-open lần đầu sau khi mở app (kịch bản lỗi gốc)

| TC ID        | Title                                                                                             | Priority | Precondition                                                               | Test Data                | Steps                                                                                                                                                | Expected Result                                                                                                 | Status |
| ------------ | ------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP5293-01 | Thanh toán đơn A + A2 cho khách có điểm                                                           | High     | `VP5293_PHASE=pay`, Manual                                                 | Khách loyalty, $63, Cash | 1. Home: staff + service, gán khách. 2. Pay → Cash → Complete. 3. Đọc điểm + `pointBonus`. 4. Lặp cho A2                                             | Mỗi đơn +63 (= award tính theo setting), `pointBonus` = 63; lưu A, A2 vào `.tmp/vp5293.json`                    | ⚠️     |
| TC-VP5293-11 | Re-open **đầu tiên** sau khi mở lại app, thêm dịch vụ: thu hồi −N rồi cộng +M (đúng kịch bản gốc) | Critical | Đã chạy TC-01; **tắt hẳn app + msedgedriver rồi mở lại**; chạy trước TC-02 | Đơn A2, Dark Queen $100  | 1. Order History → A2 → Re-Open → Confirm → Edit Order. 2. Chọn thợ tile 1 → Dark Queen. 3. Pay → Cash $105 → No Tip. 4. Đọc điểm, `pointBonus`, log | Total $168; điểm = trước −63 +168 (+105); `pointBonus` 168; log `pointBonus 63, owner stamp present, award 168` | ⚠️     |
| TC-VP5293-02 | Re-open lần đầu ngay sau khi mở lại app không cộng chồng                                          | Critical | Đã chạy TC-01; **tắt hẳn app rồi mở lại** (CDP 9222)                       | Đơn A                    | 1. Order History → đơn A → Re-Open Order → Confirm. 2. Change Staff sang tile 2. 3. Pay → Re-Open Done. 4. Đọc điểm                                  | Total giữ nguyên; thợ đổi; điểm khách **không đổi**; `pointBonus` giữ 63                                        | ⚠️     |
| TC-VP5293-03 | Log re-complete đơn A đọc được điểm cũ + chủ điểm                                                 | High     | Sau TC-02                                                                  | Log POS ngày chạy        | Tìm dòng `re-complete of order <A>` trong log POS                                                                                                    | Có dòng; chứa `pointBonus 63, owner stamp present`; **không** có `pointBonus none` (không đi nhánh bán lần đầu) | ⚠️     |

## 2. Re-open khi cache đã bị xoá / còn nóng

| TC ID        | Title                                                         | Priority | Precondition | Test Data | Steps                                                                                                   | Expected Result                                                                               | Status |
| ------------ | ------------------------------------------------------------- | -------- | ------------ | --------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| TC-VP5293-04 | Reload webview (xoá cache order) rồi re-open không cộng chồng | High     | App đang mở  | Đơn B $63 | 1. Thanh toán đơn B (+63). 2. Reload webview staff (mất cache react-query). 3. Re-Open → đổi thợ → Done | Điểm không đổi sau re-complete; `pointBonus` giữ; log có `pointBonus 63, owner stamp present` | ✅     |
| TC-VP5293-05 | Re-open cùng phiên (order còn trong cache) không cộng chồng   | High     | App đang mở  | Đơn C $63 | 1. Thanh toán đơn C (+63). 2. Re-Open ngay → đổi thợ → Done                                             | Như TC-04                                                                                     | ✅     |

## 3. Chưa tự động được / tài liệu

| TC ID        | Title                                                        | Priority | Precondition                                                                | Test Data                  | Steps                                                                   | Expected Result                                                                                  | Status                                                         |
| ------------ | ------------------------------------------------------------ | -------- | --------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| TC-VP5293-06 | Re-open tăng tổng tiền (cùng phiên) → thu hồi −N rồi cộng +M | High     | Đơn D đã thanh toán $63                                                     | Dark Queen $100            | Re-Open → Edit Order → chọn thợ → Dark Queen → Pay → Cash $105 → No Tip | Total $168; điểm −63 +168; `pointBonus` 168; log `award 168`                                     | ✅                                                             |
| TC-VP5293-07 | Lần checkout đầu bị API trả FAIL / MISSING_ORDER_DATA        | Medium   | API trả lỗi cho checkinAndCheckout                                          | —                          | Thanh toán → Re-Open → Done                                             | Log `sent nothing` / Sentry `recomplete_points`, không cộng chồng                                | 🧱 không ép được API trả lỗi trên dev                          |
| TC-VP5293-08 | Không đọc lại được order khi re-complete (mất mạng)          | Medium   | Re-open, cắt mạng trước Re-Open Done                                        | —                          | Re-Open → đổi thợ → cắt mạng → Pay → Done                               | POS từ chối complete (`refusing to re-complete … no fresh order row`), không ghi gì              | 🧱 setOffline không cắt sync Rust; phải tắt mạng máy thật      |
| TC-VP5293-09 | Hybrid: re-open thêm dịch vụ → thu hồi −N rồi cộng +M        | Medium   | Spec tự đổi Portal Checkout type = **Hybrid** (PortalCdp), đợi POS đọc được | Đơn E $63, Dark Queen $100 | Lặp TC-06 dưới Hybrid                                                   | Điểm −63 +168; `pointBonus` 168; log `award 168`                                                 | ⚠️ cần `.portal-profile` đã đăng nhập (`npm run portal:login`) |
| TC-VP5293-12 | Auto: re-open thêm dịch vụ → điểm cố định, không cộng chồng  | Medium   | Spec tự đổi Portal Checkout type = **Auto**, đợi POS đọc được               | Đơn F $63, Dark Queen $100 | Lặp TC-06 dưới Auto                                                     | Điểm sau re-complete = trước (bonus cố định −N +N); `pointBonus` giữ; không có `pointBonus none` | ⚠️ cần `.portal-profile` đã đăng nhập                          |
| TC-VP5293-10 | Portal Points history không có dòng "Complete Checkin" thứ 2 | Low      | Sau TC-02                                                                   | Khách loyalty              | Portal → Customers → khách → Points history                             | Không có dòng cộng mới cho đơn A sau re-open (hoặc có cặp Revoke −63 / +63)                      | 📄 kiểm tay trên Portal                                        |

## Ghi chú automation

- Spec tạo dữ liệu thật và cộng điểm thật cho khách loyalty. Chỉ dev / staging.
- Chạy đủ: pha `pay` → tắt app + mở lại có CDP → pha `reopen` (TC-02..05). Pha `reopen` không có `.tmp/vp5293.json` thì TC-02/03 SKIP.

```
VP5293_PHASE=pay npm run test:attach -- --spec tests/regression/checkout-type/vp-5293-reopen-recomplete-points.spec.ts
# tắt app, mở lại có CDP 9222
VP5293_PHASE=reopen npm run test:attach -- --spec tests/regression/checkout-type/vp-5293-reopen-recomplete-points.spec.ts
```

- Restart giữa 2 pha: tắt **cả `volt-pos` lẫn `msedgedriver`** rồi để lane attach tự mở app
  (`Stop-Process -Name volt-pos,msedgedriver -Force`). Chỉ tắt app rồi mở tay thì msedgedriver cũ còn
  sống, trang staff thành `about:blank` và root hook fail "header menu link /home" (08/11).
- Re-open chỉ đổi thợ thì POS không gửi gì (`sent nothing`) — đúng, vì tổng không đổi.
- Spec cũ `vp-4591-reopen-change-staff.spec.ts` (đang skip) kết luận "editor khoá item" là SAI: nó bấm dịch vụ mà
  không chọn thợ → popup "Select Staff First". Cần sửa khi bật lại spec đó.
- TC-11 nằm ngay sau TC-01 trong spec để A2 là đơn re-open **đầu tiên** sau khi mở app.
- **Setting Portal theo từng TC:** mỗi TC gọi `useCheckoutType(this, MANUAL | HYBRID | AUTO)` →
  `PortalSettingsSession.ensure()` (src/support/portal/portalSettings.ts) mở Portal bằng Edge `.portal-profile`
  qua CDP :9333, chỉ Save khi khác, tải lại xác nhận, rồi đợi POS đọc được giá trị mới (tối đa 3 phút).
  `after` gọi `restore()` trả Portal về giá trị trước TC đầu tiên. Portal chưa đăng nhập → TC vẫn chạy nếu POS
  đang đúng kiểu, không thì SKIP kèm lý do. TC-09/12 gắn `@exclusive` (setting chung cả tiệm).
- TC-07, 08, 10 là PENDING trong spec (`it.skip` kèm lý do).
- Ảnh lưu ở `.playwright-mcp/VP-5293/`.
