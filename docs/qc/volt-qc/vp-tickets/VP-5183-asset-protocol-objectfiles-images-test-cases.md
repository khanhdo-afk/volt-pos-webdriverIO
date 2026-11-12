---
title: Ảnh từ ObjectFiles (logo tiệm, avatar staff, chữ ký) load được qua asset protocol — test cases
ticket: VP-5183 — https://linear.app/fastboy/issue/VP-5183/pos-windows-staff-avatars-store-logo-and-receipt-images-never-load-the
sub-issues: VP-6823 (related) — https://linear.app/fastboy/issue/VP-6823
spec-files: tests/regression/settings/vp-5183-objectfiles-images.spec.ts
imported-at: 2026-11-10
updated-at: 2026-11-10
---

# Test Cases – [POS] [Windows] Staff avatars, store logo and receipt images never load: the asset protocol refuses every ObjectFiles path

**Ticket:** [VP-5183](https://linear.app/fastboy/issue/VP-5183/pos-windows-staff-avatars-store-logo-and-receipt-images-never-load-the) · project Maintenance 2026-Q4 · related VP-5122
**Dev:** Nam Pham (Dev) — chuyển Ready to Review 09/11, nhờ QC retest
**Trạng thái:** QC Completed — test tay trên dev 1.1.115 (10/11/2026): 7/7 PASS.
**Tự động (10/11/2026, dev 1.1.115):** `npm run test:spec` → 8 PASS / 0 FAIL / 2 PENDING (TC-08 ngoài phạm vi, TC-09 bị chặn bởi VP-6823 Time Tracking đơ). TC-10 tự kill + mở lại app.

## Hành vi mong đợi

1. Mọi ảnh app đọc từ `%APPDATA%\VoltPOS\ObjectFiles\<merchantId>\` qua `http://asset.localhost/<path>` trả **200**, không còn 403.
   Đường dẫn do `useImage` dựng (`${objectFilesPath}/${imagePath}`, trộn `\` và `/`) cũng phải được cho phép.
2. Ảnh hiện ở: logo tiệm (Settings → Receipt Preview, Receipt Details, receipt in ra), ảnh thương hiệu (Settings → Business Info → Store Brand),
   chữ ký trong Receipt Details, avatar staff ở Home.
3. Log `%LOCALAPPDATA%\VoltPOS\logs\<ngày>.log` không có dòng `tauri::protocol::asset … not configured to allow the path`,
   kể cả khi khởi động lại app lúc đã đăng nhập.

## Điều kiện chung

- Môi trường DEV, merchant #14 "Volt POS tiem test 14 v1", POS Windows **≥ 1.1.115**, đã đăng nhập.
- Tiệm có Business Logo + Cover Photo; có staff có avatar; có order Card đã ký.
- Biến env (mặc định theo tiệm 14):
  - `VP5183_FILES` — file trong ObjectFiles để fetch, cách nhau dấu phẩy (mặc định `01a05bb3-7eb2-7e03-b17f-f1166822fa81.png,019dd1c5-0867-7860-b30c-bcb5550ed9c7.webp`)
  - `VP5183_AVATAR_STAFF` — staff có avatar (mặc định `Angela Tyler 89999`)
  - `VP5183_SIGNED_ORDER` — order Card có chữ ký (mặc định `OD261109-28956493`)
- Passcode staff 8888 cho Settings.
- Print không cần máy in: spec bắt payload `mutation print` qua IPC (base64 ESC/POS), ảnh raster `GS v 0` = `[IMAGE]`.

Chú thích trạng thái: ✅ tự động được trên POS Windows · ⚠️ tự động được, có điều kiện · 🧱 chưa tự động được ở đây · 📄 chỉ tài liệu / test tay.

## 1. Asset protocol

| TC ID        | Title                                                  | Priority | Precondition     | Test Data      | Steps                                                                                                                                                 | Expected Result                                            | Status |
| ------------ | ------------------------------------------------------ | -------- | ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| TC-VP5183-01 | Asset protocol đọc file ObjectFiles (3 dạng đường dẫn) | Critical | App đã đăng nhập | `VP5183_FILES` | 1. Lấy `objectFilesPath` qua GraphQL. 2. `fetch("http://asset.localhost/" + encodeURIComponent(path))` với đường dẫn trộn `\`/`/`, toàn `\`, toàn `/` | Mọi request trả 200, content-type `image/*`, body > 0 byte | ✅     |

## 2. Logo tiệm, ảnh thương hiệu, chữ ký

| TC ID        | Title                                  | Priority | Precondition           | Test Data                          | Steps                                                        | Expected Result                                                                                 | Status |
| ------------ | -------------------------------------- | -------- | ---------------------- | ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------ |
| TC-VP5183-02 | Logo ở Settings → Receipt Preview      | High     | Tiệm có logo           | Business Logo                      | Settings → Receipt (passcode) → xem Receipt Preview          | Ảnh "Business Logo" load từ `asset.localhost`, `naturalWidth > 0`                               | ✅     |
| TC-VP5183-03 | Logo có trong receipt in ra            | High     | Có order đã thanh toán | Order mới nhất trong Order History | Order History → order → Receipt → Print; bắt payload lệnh in | Dòng đầu receipt là ảnh raster (`[IMAGE]`) nằm trước tên tiệm; dialog Receipt Details hiện logo | ✅     |
| TC-VP5183-04 | Chữ ký trong Receipt Details           | Medium   | Order Card đã ký       | `VP5183_SIGNED_ORDER`              | Order History → order → Receipt                              | Ảnh "Signature" load, `naturalWidth > 0`                                                        | ✅     |
| TC-VP5183-05 | Store Brand ở Settings → Business Info | Medium   | Tiệm có logo + cover   | Store Logo, Cover Photo            | Settings → Business Info → kéo tới Store Brand               | Cả 2 ảnh "Preview" load, `naturalWidth > 0`                                                     | ✅     |

## 3. Avatar staff

| TC ID        | Title                                        | Priority | Precondition                              | Test Data             | Steps                                                                   | Expected Result                                                                                                                                             | Status                                                                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------- | -------- | ----------------------------------------- | --------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-VP5183-06 | Avatar staff ở Home                          | High     | Staff có avatar                           | `VP5183_AVATAR_STAFF` | Home → tìm ô staff                                                      | Ảnh avatar (alt = tên staff) load từ `asset.localhost`, `naturalWidth > 0`, không phải ảnh mặc định                                                         | ✅                                                                                                                                                                                                                                                                                     |
| TC-VP5183-08 | Avatar ở report Staff Payroll / Staff Income | Low      | Staff có avatar, có data kỳ hiện tại      | `VP5183_AVATAR_STAFF` | Staff Payroll → tìm staff                                               | Ticket kỳ vọng avatar. Thực tế (10/11): hiện chữ cái đầu, app không gửi request ảnh nào, không có lỗi asset → report không lấy avatar, ngoài phạm vi ticket | 📄                                                                                                                                                                                                                                                                                     |
| TC-VP5183-09 | Avatar ở Time Tracking                       | Low      | Staff có record chấm công (Angela: 31/10) | `VP5183_AVATAR_STAFF` | Time Tracking → chọn ngày có record (hoặc Search staff) → xem cột Staff | Avatar staff hiện                                                                                                                                           | 🧱 bị chặn bởi bug app 🐞 VP-6823 — 1.1.115: Time Tracking đơ hẳn khi bấm "+", gõ Search staff hoặc mở dropdown ngày (renderer 100% CPU, RAM tăng liên tục; spec `time-tracking.spec.ts` TC-TT-04 cũng treo). Bug chưa log. Turn board bỏ khỏi TC (không có trong menu, `/turn` = 404) |

## 4. Log và khởi động lại

| TC ID        | Title                              | Priority | Precondition          | Test Data   | Steps                                                                                             | Expected Result                                                                                               | Status                                    |
| ------------ | ---------------------------------- | -------- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| TC-VP5183-07 | Log không có lỗi asset protocol    | High     | Đã chạy các TC 02–06  | Log hôm nay | Đếm dòng `not configured to allow the path` trong log hôm nay, trước và sau khi mở các màn có ảnh | Không có dòng mới (máy chạy spec = máy chạy POS)                                                              | ⚠️                                        |
| TC-VP5183-10 | Khởi động lại app khi đã đăng nhập | High     | App đã có credentials | —           | Tắt app → mở lại (vào thẳng, không login) → lặp TC-02, TC-06                                      | Ảnh vẫn load; asset fetch 200; log không có lỗi asset (bước `Configuration` của splash vẫn cấp quyền thư mục) | ✅ spec kill + mở lại app (`relaunchApp`) |
