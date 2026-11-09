---
title: Portal Store Settings › Configuration — thẻ POS Accessibility (Customer display, Default POS screen, Font size) — test cases
ticket: VP-5723 — https://linear.app/fastboy/issue/VP-5723/portal-store-settings-configuration-gom-customer-display-default-pos
sub-issues: không có
spec-files: tests/web/portal-vp-5723-pos-accessibility.spec.ts
imported-at: 2026-11-09
updated-at: 2026-11-09
---

# Test Cases – [PORTAL] Store Settings › Configuration: gom Customer display, Default POS screen, Font size vào một thẻ POS Accessibility

**Ticket:** [VP-5723](https://linear.app/fastboy/issue/VP-5723/portal-store-settings-configuration-gom-customer-display-default-pos) · project Maintenance 2026-Q4 · liên quan VP-5685 (Default POS screen), VP-5724 (Tile colors), VP-4809 (Font size)
**Dev:** Ngan Huynh (`ngan_huynh`) · PR FastboyMarketing/fastboy-portal#980
**Trạng thái:** QC Completed 09/11/2026 — test tay 15/15 PASS (Portal DEV + POS Windows dev 1.1.113).
**Automation 09/11/2026:** `VP5723_POS_CDP=http://127.0.0.1:9223 npm run portal:vp-5723` → **15/15 PASS** (1m 8s), POS dev 1.1.113 qua CDP 9223; setting store #14 đã khôi phục (Show points ON, Show rewards ON, Pending Orders, Small).

## Hành vi mong đợi

1. Tab **Configuration** có một thẻ **POS Accessibility** ở cột phải, ngay dưới **Privacy policy**; tiêu đề `POS Accessibility`, dòng phụ `Display settings for every POS terminal of this merchant.`
2. Trong thẻ theo thứ tự: **Customer display** → **Default POS screen** → (**Tile colors**, khi VP-5724 làm xong) → **Font size**.
3. Không còn thẻ Customer display / Font size đứng riêng.
4. Cách lưu giữ như cũ: Customer display và Font size **lưu ngay** (toast «Customer display updated» / «Font size updated»); Default POS screen dùng thanh lưu nổi «1 unsaved change · Discard · Save» (toast «Default POS screen updated»).
5. Giá trị đồng bộ sang POS như trước. POS › Setting › Accessibility **không đổi** (vẫn từng thẻ riêng).

## Điều kiện chung

- Portal DEV `https://v2.dev-fastboypay.com/pos/nail/14/setting?tab=configuration`, merchant #14 "Volt POS tiem test 14 v1".
- Spec chạy web lane: Edge trên `.portal-profile/` đã đăng nhập (`npm run portal:login` một lần) — `npm run portal:vp-5723`.
- DOM Portal (đọc 09/11): switch `#customer-display-show-point`, `#customer-display-show-reward`; radiogroup `[aria-label="Default POS screen"]` (giá trị `pending_orders`, `home`, `order_history`, `batch_history`, `time_tracking`, `appointment`, `setting`), radiogroup `[aria-label="Font size"]` (`small`/`medium`/`large`); tiêu đề mục `[data-slot="settings-card-step-title"]`, tiêu đề thẻ `[data-slot="settings-card-section-title"]`.
- Lưu ở `sys_settings`: `merchant_customer_display` (`show_point`, `show_reward`), `merchant_default_screen`, `merchant_theme_pos_style.font_size`.
- Setting là **global của tiệm** → spec gắn `@exclusive`, chụp giá trị ban đầu và trả lại trong `after()` (TC-15).
- TC-13/TC-14 cần POS Windows đang chạy với CDP: `VP5723_POS_CDP` (mặc định `http://127.0.0.1:<REMOTE_DEBUG_PORT>`; nếu TeamViewer giữ 9222 thì launch POS với `REMOTE_DEBUG_PORT=9223` và đặt `VP5723_POS_CDP=http://127.0.0.1:9223`). Không có POS → 2 TC này PENDING. TC-14 cần passcode Settings: `STAFF_PASSCODE` (8888).
- Giá trị gốc merchant #14 (09/11): Show points balance ON, Show rewards ON, Default = Pending Orders, Font size = Small.

Chú thích trạng thái: ✅ tự động được (Portal web lane) · ⚠️ tự động được, có điều kiện · 🧱 chưa tự động được · 📄 chỉ tài liệu · 🐞 bug đã log.

## 1. Bố cục thẻ POS Accessibility

| TC ID        | Title                                            | Priority | Precondition         | Test Data | Steps                                 | Expected Result                                                                                                                          | Status |
| ------------ | ------------------------------------------------ | -------- | -------------------- | --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP5723-01 | Thẻ POS Accessibility dưới Privacy policy        | High     | Portal đã đăng nhập  | —         | 1. Store Settings → tab Configuration | Có thẻ `POS Accessibility` ngay sau `Privacy policy` ở cột phải; dòng phụ `Display settings for every POS terminal of this merchant.`    | ✅     |
| TC-VP5723-02 | Thứ tự các mục trong thẻ                         | High     | Như TC-01            | —         | 1. Đọc tiêu đề các mục trong thẻ      | Đúng thứ tự Customer display → Default POS screen → (Tile colors) → Font size; mỗi mục có dòng phụ                                       | ✅     |
| TC-VP5723-03 | Không còn thẻ Customer display / Font size riêng | High     | Như TC-01            | —         | 1. Đếm switch và radiogroup trên tab  | Mỗi switch Show points / Show rewards và mỗi radiogroup chỉ xuất hiện 1 lần, nằm trong thẻ POS Accessibility; không có thẻ tiêu đề riêng | ✅     |
| TC-VP5723-04 | Tile colors chưa hiện (VP-5724 chưa làm)         | Low      | VP-5724 chưa release | —         | 1. Tìm mục Tile colors                | Không có mục Tile colors; nếu có thì có Bold (Default) / Pastel                                                                          | ✅     |

## 2. Customer display

| TC ID        | Title                                | Priority | Precondition | Test Data        | Steps                                  | Expected Result                                                                        | Status |
| ------------ | ------------------------------------ | -------- | ------------ | ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| TC-VP5723-05 | 2 toggle khớp giá trị đang lưu       | High     | Như TC-01    | —                | 1. Đọc 2 switch. 2. Reload. 3. Đọc lại | Có Show points balance + Show rewards; trạng thái không đổi sau reload (= giá trị lưu) | ✅     |
| TC-VP5723-06 | Bật/tắt Show points balance lưu ngay | Critical | Như TC-01    | Show points đảo  | 1. Bấm switch Show points balance      | Toast «Customer display updated», không hiện thanh lưu nổi; Show rewards giữ nguyên    | ✅     |
| TC-VP5723-07 | Đổi cả 2 toggle → reload vẫn giữ     | High     | Sau TC-06    | Show rewards đảo | 1. Bấm switch Show rewards. 2. Reload  | Mỗi lần đổi có toast; sau reload 2 switch giữ giá trị mới                              | ✅     |

## 3. Default POS screen

| TC ID        | Title                                      | Priority | Precondition      | Test Data | Steps                                                                                                        | Expected Result                                                                                                 | Status |
| ------------ | ------------------------------------------ | -------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP5723-08 | Có Pending Orders (Default) và Home        | High     | Như TC-01         | —         | 1. Đọc radiogroup Default POS screen                                                                         | Có `pending_orders` (nhãn Default) và `home`; đúng 1 lựa chọn đang chọn — ℹ️ DEV có 7 lựa chọn, chờ PO xác nhận | ✅     |
| TC-VP5723-09 | Thanh lưu nổi: Discard không gửi, Save lưu | Critical | Default = Pending | Home      | 1. Chọn Home → «1 unsaved change». 2. Discard. 3. Chọn Home → Save. 4. Reload. 5. Chọn Pending Orders → Save | B2: về Pending Orders, không có request ghi. B3: toast «Default POS screen updated». B4: vẫn Home. B5: lưu được | ✅     |

## 4. Font size

| TC ID        | Title                                  | Priority | Precondition | Test Data              | Steps                       | Expected Result                                                                 | Status |
| ------------ | -------------------------------------- | -------- | ------------ | ---------------------- | --------------------------- | ------------------------------------------------------------------------------- | ------ |
| TC-VP5723-10 | 3 lựa chọn Small / Medium / Large      | High     | Như TC-01    | —                      | 1. Đọc radiogroup Font size | Đúng `small, medium, large`, nhãn Small/Medium/Large, đúng 1 lựa chọn đang chọn | ✅     |
| TC-VP5723-11 | Đổi Font size lưu ngay, reload vẫn giữ | High     | Như TC-01    | Lựa chọn khác hiện tại | 1. Chọn cỡ khác. 2. Reload  | Toast «Font size updated», không hiện thanh lưu; sau reload vẫn là cỡ mới       | ✅     |

## 5. Khác

| TC ID        | Title                                   | Priority | Precondition                                       | Test Data                                   | Steps                                                                                         | Expected Result                                                                                                                                  | Status |
| ------------ | --------------------------------------- | -------- | -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| TC-VP5723-12 | Không lỗi console / API 4xx-5xx         | Medium   | Hook `console.error` + XHR cài trước khi tải trang | —                                           | 1. Mở tab Configuration. 2. Thao tác các TC trên                                              | Không có `console.error`/lỗi JS; không XHR nào trả 4xx/5xx                                                                                       | ⚠️     |
| TC-VP5723-13 | Đồng bộ Portal → POS                    | High     | POS Windows chạy, CDP `VP5723_POS_CDP`             | Show points OFF, Default = Home, Font Large | 1. Đổi 3 giá trị trên Portal. 2. Đọc `sysSettingList` của POS qua CDP                         | POS nhận `show_point=false` (`show_reward` giữ), `merchant_default_screen=home`, `font_size=large` trong ≤ 60 s; `<html data-font-size>` = large | ⚠️     |
| TC-VP5723-14 | POS › Setting › Accessibility không đổi | Medium   | Như TC-13, passcode `STAFF_PASSCODE`               | —                                           | 1. POS mở `/settings/accessibility` (nhập passcode nếu hỏi). 2. Đọc các thẻ                   | Font Size, Customer Display, Default Screen là 3 thẻ riêng; không có tiêu đề `POS Accessibility`                                                 | ⚠️     |
| TC-VP5723-15 | Khôi phục setting sau khi test          | Medium   | Sau mọi TC                                         | Giá trị chụp đầu spec                       | 1. `after()` đặt lại Show points, Show rewards, Default screen, Font size. 2. Reload, đọc lại | 4 giá trị = giá trị ban đầu                                                                                                                      | ✅     |
