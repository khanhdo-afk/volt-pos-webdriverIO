---
title: Tile Colors — màu ô thợ / ô dịch vụ trên Create Order (Bold / Pastel) — test cases
ticket: VP-5724 — https://linear.app/fastboy/issue/VP-5724/posandportal-tile-colors-setting-chon-mau-o-tho-va-o-dich-vu-tren
sub-issues: —
spec-files: tests/regression/settings/vp-5724-tile-colors.spec.ts
imported-at: 2026-11-12
updated-at: 2026-11-12
---

# Test Cases – [POS&Portal] Tile Colors: setting chọn màu ô thợ và ô dịch vụ trên Create Order (Bold / Pastel)

**Ticket:** [VP-5724](https://linear.app/fastboy/issue/VP-5724/posandportal-tile-colors-setting-chon-mau-o-tho-va-o-dich-vu-tren) · project Maintenance 2026-Q4-M11-W2 · liên quan VP-5338, VP-5723, VP-6838
**Dev:** Ngan Huynh (`ngan_huynh`) · PR FastboyMarketing/volt-pos#3425 (develop, 11/11) + #3433 (Kotlin) · volt-pos-api#1651 · fastboy-portal#1020
**Trạng thái:** QC Completed — test tay 12/11/2026 trên POS dev 1.1.120 + Portal DEV: 16/16 PASS.
**Automation 12/11/2026:** `npm run test:spec` trên POS dev 1.1.120 (bản mới nhất trên feed) + Portal DEV qua `PortalStore`: **16 PASS / 0 FAIL / 7 PENDING (test tay)**.

## Hành vi mong đợi

1. Setting **Tile Colors** cho cả tiệm, 2 giá trị **Bold** (mặc định) / **Pastel**, lưu ở field `tile_colors` của row `merchant_theme_pos_style` (cạnh `font_size`).
2. **Bold** = Create Order như cũ: ô Category, ô dịch vụ nền đậm chữ trắng. Màu staff-palette đã lưu được vẽ bằng màu đậm "partner" (`CATEGORY_BOLD_BY_PASTEL`).
3. **Pastel**: ô Category (cả Product) + ô dịch vụ nền = partner pastel trong bảng Staff (`CATEGORY_PASTEL_BY_BOLD`, màu ngoài bảng → màu Staff gần nhất), chữ đen (ink). Quick Pay / Gift Card giữ màu nền, chỉ đổi chữ đen. Ô thợ không đổi.
4. Chỉ đổi hiển thị, không đổi màu đã lưu của Category → đổi về Bold thấy lại đúng màu cũ.
5. Sửa ở Portal hay POS nào thì mọi nơi thấy giá trị mới, không cần mở lại app. Lưu không làm mất `font_size` / theme.
6. Đang chạy theme pack (không phải Classic) thì setting không áp dụng (pack tự vẽ ô).

## Điều kiện chung

- Môi trường DEV, merchant #14, POS Windows **≥ 1.1.120** (build sau khi merge volt-pos#3425), theme Classic.
- Portal DEV: Store Settings › Configuration › POS Accessibility › **Tile colors** (radio `#tileColors-bold` / `#tileColors-pastel`).
- POS: Setting › Accessibility › thẻ **Tile Colors** (testid `tile-colors-bold|pastel`, `tile-colors-save`, `tile-colors-preview-*`), passcode POS Settings 8888.
- Oracle: GraphQL trong POS `sysSettingList(where:{key:{eq:"merchant_theme_pos_style"}}){value}` → `{"font_size":…,"tile_colors":…}`; `categoryList{name colorHex}` để tính màu mong đợi.
- Case Portal ↔ POS dùng `PortalStore` (Edge `.portal-profile/`) — hết phiên thì `npm run portal:auth` (user tự quét QR), không có phiên thì các case đó SKIP.
- Spec trả tiệm về **Bold** và giữ `font_size` gốc ở `after`.

Chú thích trạng thái: ✅ tự động được · ⚠️ được, có điều kiện · 🧱 chưa tự động được (lý do) · 📄 test tay (không code — app mobile / version) · 🐞 VP-xxxx bug đã log.

## 1. Thẻ Tile Colors trên POS

| TC ID        | Title                                                   | Priority | Precondition          | Test Data     | Steps                                                             | Expected Result                                                                                                       | Status                                                                                         |
| ------------ | ------------------------------------------------------- | -------- | --------------------- | ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| TC-VP5724-01 | Thẻ Tile Colors nằm ngay dưới Default Screen            | High     | Build ≥ 1.1.120       | —             | 1. Setting › Accessibility (passcode) 2. Cuộn tới thẻ Tile Colors | Thẻ ngay sau Default Screen; 2 ô Bold / Pastel có hình preview; chữ phụ "Bold service tiles" / "Pastel service tiles" | ✅                                                                                             |
| TC-VP5724-02 | Bold mặc định, nhãn Default, Save khoá                  | High     | Tiệm đang Bold        | `bold`        | 1. Mở thẻ                                                         | Bold được chọn, có nhãn "Default", nút Save tắt                                                                       | ✅                                                                                             |
| TC-VP5724-03 | Đổi lựa chọn mở Save, chọn lại giá trị đã lưu khoá Save | Medium   | Tiệm đang Bold        | —             | 1. Chọn Pastel 2. Chọn lại Bold                                   | Bước 1 Save bật; bước 2 Save tắt; DB vẫn `bold`                                                                       | ✅                                                                                             |
| TC-VP5724-04 | Lưu Pastel trên POS                                     | Critical | Tiệm đang Bold        | `pastel`      | 1. Chọn Pastel 2. Save                                            | Toast "Tile colors setting updated successfully"; Save tắt lại; DB `tile_colors = pastel`, `font_size` giữ nguyên     | ✅                                                                                             |
| TC-VP5724-05 | Lưu Bold trên POS                                       | Critical | Tiệm đang Pastel      | `bold`        | 1. Chọn Bold 2. Save                                              | Toast thành công; DB `tile_colors = bold`, `font_size` giữ nguyên                                                     | ✅                                                                                             |
| TC-VP5724-06 | Vào Setting phải nhập passcode POS Settings             | Medium   | Gate POS Settings bật | Passcode 8888 | 1. Menu ≡ › Setting                                               | Hỏi passcode trước khi vào                                                                                            | 🧱 grant "30 phút không hỏi" dùng chung cả suite — đã có ở suite passcode, test tay 12/11 PASS |

## 2. Màu ô trên Create Order

| TC ID        | Title                                             | Priority | Precondition      | Test Data               | Steps                                                      | Expected Result                                                                                                                            | Status                                                        |
| ------------ | ------------------------------------------------- | -------- | ----------------- | ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| TC-VP5724-07 | Bold: ô Category + ô dịch vụ nền đậm chữ trắng    | Critical | Tiệm Bold         | `categoryList.colorHex` | 1. Mở Create Order 2. Đọc màu nền / chữ từng ô             | Nền = `boldCategoryColor(colorHex)` (màu staff → partner đậm), chữ trắng (tên, số dịch vụ, giá)                                            | ✅                                                            |
| TC-VP5724-08 | Pastel: ô Category + ô dịch vụ nền pastel chữ đen | Critical | Tiệm Pastel       | `categoryList.colorHex` | 1. Mở Create Order 2. Đọc màu                              | Nền = `CATEGORY_PASTEL_BY_BOLD[colorHex]` (hoặc chính nó nếu đã là màu Staff); chữ đen #2F2C35 (tên, số dịch vụ, giá); cả Category Product | ✅                                                            |
| TC-VP5724-09 | Pastel: Quick Pay / Gift Card giữ màu, chữ đen    | High     | Tiệm Pastel       | #E66436 / #F49D1A       | 1. Xem 2 ô ghim                                            | Nền giữ #E66436 / #F49D1A, chữ đen                                                                                                         | ✅                                                            |
| TC-VP5724-10 | Pastel: mọi màu nền thuộc bảng Staff (CC-10)      | High     | Tiệm Pastel       | Bảng 15 màu Staff       | 1. Đọc nền mọi ô Category / dịch vụ (trừ ô ghim)           | Mọi nền ∈ `STAFF_PALETTE_HEX` (VP-5338)                                                                                                    | ✅                                                            |
| TC-VP5724-11 | Pastel: chữ đen đọc rõ (CC-07)                    | Medium   | Tiệm Pastel       | WCAG                    | 1. Tính tương phản chữ / nền từng ô pastel                 | Tương phản ≥ 4.5:1 trên mọi ô pastel                                                                                                       | ✅                                                            |
| TC-VP5724-12 | Ô thợ giống nhau ở Bold và Pastel                 | High     | —                 | —                       | 1. Đọc màu chữ ô thợ ở Bold 2. Đổi Pastel, đọc lại         | Màu chữ tên thợ không đổi giữa 2 kiểu                                                                                                      | ✅                                                            |
| TC-VP5724-13 | Trạng thái chọn giữ nguyên ở Pastel (CC-05)       | High     | Tiệm Pastel       | Thợ đầu, dịch vụ đầu    | 1. Chọn thợ 2. Thêm dịch vụ 3. Xoá order nháp              | Ô thợ đang chọn nền tối chữ trắng; ô dịch vụ đã thêm có viền đậm (`::after` border 4px)                                                    | ⚠️ tạo 1 order nháp rồi xoá                                   |
| TC-VP5724-14 | Đổi về Bold thấy lại đúng màu cũ (CC-06)          | Critical | Ảnh chụp màu Bold | —                       | 1. Đọc màu Bold 2. Pastel 3. Bold lại 4. So                | Màu nền / chữ mọi ô Category + dịch vụ y như lần đọc đầu; `categoryList.colorHex` không đổi                                                | ✅                                                            |
| TC-VP5724-15 | Màn khác không đổi theo Pastel (CC-06)            | Medium   | Tiệm Pastel       | —                       | 1. Xem Appointment, Pending Orders, Order History, hoá đơn | Không đổi màu theo Tile Colors                                                                                                             | 🧱 không có oracle màu "trước/sau" cho các màn này — test tay |

## 3. Portal ↔ POS

| TC ID        | Title                                                  | Priority | Precondition                            | Test Data                 | Steps                                                                            | Expected Result                                                                                                                                                                               | Status                                                                  |
| ------------ | ------------------------------------------------------ | -------- | --------------------------------------- | ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| TC-VP5724-16 | Portal → POS: lưu Pastel trên Portal                   | Critical | Phiên Portal `.portal-profile/`         | `pastel`                  | 1. Portal chọn Pastel → Save 2. Đọc DB POS (không mở lại app) 3. Mở Create Order | POS đọc `tile_colors = pastel` không cần mở lại app; Create Order vẽ Pastel                                                                                                                   | ⚠️ cần phiên Portal                                                     |
| TC-VP5724-17 | POS → Portal: lưu Bold trên POS                        | Critical | Như TC-16, tiệm Pastel                  | `bold`                    | 1. POS chọn Bold → Save 2. Đọc lại Portal                                        | Portal hiện Bold                                                                                                                                                                              | ⚠️ cần phiên Portal                                                     |
| TC-VP5724-18 | Portal lưu Font size không làm mất `tile_colors`       | High     | Như TC-16, tiệm Pastel                  | Font size đổi rồi trả lại | 1. Portal đổi Font size → Save 2. Đọc DB POS                                     | Lưu thành công (không lỗi `invalid field(s): tile_colors`); POS vẫn `tile_colors = pastel`, `font_size` mới                                                                                   | ⚠️ cần phiên Portal                                                     |
| TC-VP5724-19 | Giao diện mục Tile colors trên Portal                  | Medium   | Portal › Store Settings › Configuration | —                         | 1. Xem cụm POS Accessibility                                                     | Mục "Tile colors" dưới Default POS screen, dòng phụ "Colors of staff and service tiles on Create Order.", Bold (Default) / Pastel có hình, thanh lưu nổi `N unsaved changes · Discard · Save` | 🧱 PortalStore chỉ đọc/ghi giá trị, không kiểm UI — test tay 12/11 PASS |
| TC-VP5724-20 | Create Order đang mở tự đổi màu khi Portal lưu (CC-09) | Low      | POS đang mở Create Order                | —                         | 1. Portal lưu giá trị khác 2. Nhìn POS (không thao tác)                          | Spec chỉ yêu cầu đổi từ lần mở kế tiếp; thực tế 1.1.120 vẽ lại ngay                                                                                                                           | 🧱 `PortalStore.ensure` reload POS sau khi lưu — test tay 12/11         |

## 4. Chỉ test tay

| TC ID        | Title                                  | Priority | Precondition                | Test Data | Steps                                                  | Expected Result                                          | Status                                                                                     |
| ------------ | -------------------------------------- | -------- | --------------------------- | --------- | ------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TC-VP5724-21 | Lưu trên POS khi lỗi mạng (CC-08)      | Medium   | Rút mạng máy POS            | Pastel    | 1. Chọn Pastel 2. Save                                 | Toast lỗi, giữ lựa chọn để Save lại, máy dùng giá trị cũ | 🧱 cần rút mạng thật — mock `fetch` không chặn được IPC Tauri (tự chuyển sang postMessage) |
| TC-VP5724-22 | Android D5 / P18 / P8D                 | High     | Máy Android                 | Pastel    | 1. Setting › thẻ Tile Colors 2. Create Order (P8D: T6) | Như TC-04, TC-08 trên Android                            | 📄 test tay (không code — app mobile / version)                                            |
| TC-VP5724-23 | Theme pack đang chạy thì không áp dụng | Low      | POS Builder chạy theme pack | Pastel    | 1. Bật theme pack 2. Mở Create Order                   | Ô theo theme pack, không theo Tile Colors                | 🧱 đổi theme pack là state toàn máy, ngoài phạm vi ticket — test tay khi cần               |

## Ghi chú automation

- Spec: `tests/regression/settings/vp-5724-tile-colors.spec.ts`, helper `vp-5724.helpers.ts`. Màu mong đợi tính lại theo `CATEGORY_PASTEL_BY_BOLD` / `CATEGORY_BOLD_BY_PASTEL` (copy từ `src/shared/constants/service.ts` volt-pos#3425) trong `src/constants/testids.vp-palette.ts`.
- Spec ghi setting toàn tiệm → `@exclusive`; `after` trả về Bold (không trả snapshot, tránh lần chạy dở để lại Pastel).
- Case Portal (TC-16..18) dùng `PortalStore` — SKIP khi `.portal-profile/` hết phiên (`npm run portal:auth`).
- TC-06, 15, 19, 20, 21, 23 🧱 và TC-22 📄 không có `it()` trong spec.
- Ô ghim Quick Pay / Gift Card nhận bằng nhãn **và** `--identity-color` (#E66436 / #F49D1A): ô ghim vẫn có dòng `<p>0 Services</p>` bị ẩn, và tiệm 14 có 1 category thật tên "Gift Card" (#E9434A).
- Máy này TeamViewer giữ CDP 9222 → chạy với `APP_PATH="$LOCALAPPDATA\Volt POS\volt-pos.exe" REMOTE_DEBUG_PORT=9223`; trước khi chạy `npm run app:kill` nếu còn driver cũ.

Chạy: `npm run test:spec -- tests/regression/settings/vp-5724-tile-colors.spec.ts`
