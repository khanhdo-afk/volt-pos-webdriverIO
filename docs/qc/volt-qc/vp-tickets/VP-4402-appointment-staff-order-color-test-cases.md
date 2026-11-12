---
title: Appointment — thứ tự cột thợ theo GAP + màu appointment theo thợ — test cases
ticket: VP-4402 — https://linear.app/fastboy/issue/VP-4402/improvement-ticket-1548610-appointment-sap-xep-thu-tu-cot-tho-va-mau
sub-issues: VP-5094 (BE priority, Done), VP-5500 (BE màu thợ, Done), VP-5479 (Canceled 06/11 theo dev), VP-5481 (QC Completed 10/11 — fix volt-pos#3406, POS 1.1.115)
spec-files: tests/regression/appointment/vp-4402-staff-column-order-color.spec.ts, tests/web/gap-appointment-board.spec.ts
imported-at: 2026-11-02
updated-at: 2026-11-10
---

# Test Cases – [POS] Appointment: sắp xếp thứ tự cột thợ và màu appointment giống GAP

**Ticket:** [VP-4402](https://linear.app/fastboy/issue/VP-4402/improvement-ticket-1548610-appointment-sap-xep-thu-tu-cot-tho-va-mau) · Ticket CRM #1548610 (Xpo Nails #19388) · PR volt-pos#3274 (POS) · volt-pos-api#1566 / VP-5094 (BE sync `employee.priority`)
**Dev:** Thien Duy (`thienduy_vo`), Thanh Lam (`lam_doan`, BE) · **Bug con:** VP-5479 (1001vvv bị xếp cuối board — **Canceled** 06/11 theo yêu cầu dev), VP-5481 (màu cột khác GAP — Unassigned + thợ không màu, fix volt-pos#3406, **PASS 10/11 trên 1.1.115**)

## Hành vi mong đợi

- Cột thợ trên POS Appointment Overview xếp theo thứ tự GAP (GCI `employee.priority`), màu header/card theo màu thợ GoCheckin (`color_detail` type 1, sync 2 chiều — VP-5500).
- Theo VP-5500 (Out of scope → POS): cột **Unassigned** và thợ **không có màu** hiển thị `#5669FF` như GAP (`var(--primary)`), không dùng xám.
- Thợ cũ chỉ nhận màu/priority khi được lưu lại trên GoCheckin (không backfill) — store 14 đã lưu lại 117 thợ ngày 06/11 → 272/272 màu khớp.

## Điều kiện chung

- Môi trường DEV, merchant #14, POS Windows **≥ 1.1.87** (đã có PR volt-pos#3274). GAP: [pos.gocheckin.net](https://pos.gocheckin.net) (store 14).
- POS → header **Appointment** → màn **Appointment Overview** (board cột thợ, cột đầu là **Unassigned**).
- Thứ tự cột thợ lấy từ bảng `display_order` với `entity_type = 'staff_appointment'` (sync read-only từ GCI `employee.priority`, không phải row `entity_type = 'staff'`):
  1. `priority > 0` tăng dần → 2. `priority = 0` → 3. thợ **không có row** (POS-only / GCI chưa gửi) xếp **cuối**; cùng nhóm thì theo tên (nickname viết thường, so sánh `<`/`>`).
- POS chỉ đọc `staff_appointment` (API từ chối POST 422 / PUT 403). Muốn đổi thứ tự cột → đổi trên GCI/CRM.
- Card appointment: viền (4 cạnh) màu cột, nền **pha 30% màu cột** (`color-mix(in srgb, <màu> 30%, var(--card))`).
- Màu cột (header, badge số lượng, card) = `staff.colorHex`; từ volt-pos#3406 (≥ **1.1.115**): thợ `colorHex = null` → `#5669FF`, cột Unassigned → `var(--color-primary)` = `#5669FF` (trước đó: xám `#CDCCD2` / xám đậm `#4D4A5B`, card Unassigned không pha màu).
- Spec chỉ đọc (GraphQL in-page + computed style); appointment test được tạo **trên GAP**, POS không tạo appointment.

Chú thích trạng thái: ✅ tự động được trên POS Windows · ⚠️ tự động được nhưng có điều kiện · 🧱 không tự động được ở đây · 📄 chỉ tài liệu.

## 1. Thứ tự cột thợ

| TC ID        | Title                                              | Priority | Precondition                                      | Test Data                                                             | Steps                                                                                                    | Expected Result                                                                                            | Status |
| ------------ | -------------------------------------------------- | -------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP4402-01 | POS đã lên version có tính năng                    | High     | POS dev đã update                                 | Version ≥ 1.1.87                                                      | 1. Kiểm tra version POS                                                                                  | POS chạy ≥ **1.1.87** (build sau khi merge PR #3274)                                                       | ✅     |
| TC-VP4402-02 | Thứ tự cột thợ trên POS giống GAP                  | High     | GAP đã có thứ tự thợ; đã sync `staff_appointment` | 297 thợ có trên cả 2 board, ngày 11/02                                | 1. Mở Appointment Overview. 2. Đọc toàn bộ header cột (cuộn ngang). 3. So với thứ tự `staff_appointment` | Thứ tự cột POS = thứ tự `priority` (= thứ tự GAP); 296/297 thợ khớp (thợ lệch: 1001vvv — VP-5479 Canceled) | ✅     |
| TC-VP4402-03 | Thợ có `priority = 0` đứng sau thợ có thứ tự       | Medium   | Có thợ GCI gửi `priority = 0`                     | —                                                                     | 1. Đọc board. 2. Lấy vị trí các thợ `priority = 0`                                                       | Mọi thợ `priority = 0` nằm sau mọi thợ `priority > 0` và trước thợ không có row                            | ⚠️     |
| TC-VP4402-04 | Thợ chưa có row `staff_appointment` xếp cuối board | Medium   | Có thợ POS-only / chưa sync                       | 333, abc xyz30, Bell, Ben, Delete, Elise Terry, Emma2, JD, TestSalary | 1. Cuộn tới cuối board                                                                                   | Nhóm thợ không có row nằm cuối, theo thứ tự tên                                                            | ⚠️     |
| TC-VP4402-06 | Dropdown Staffs vẫn A→Z                            | Low      | Đang ở Appointment Overview                       | —                                                                     | 1. Mở filter **Staffs**                                                                                  | Danh sách thợ trong dropdown giữ thứ tự tên A→Z (chỉ board đổi theo GAP)                                   | ✅     |
| TC-VP4402-07 | Thứ tự cột không đổi khi chuyển ngày               | Medium   | —                                                 | Hôm nay → ngày mai                                                    | 1. Đọc thứ tự cột. 2. Next day. 3. Đọc lại                                                               | Thứ tự cột giống hệt giữa 2 ngày                                                                           | ✅     |

## 2. Màu appointment / cột

| TC ID        | Title                    | Priority | Precondition                | Test Data      | Steps                                | Expected Result                               | Status |
| ------------ | ------------------------ | -------- | --------------------------- | -------------- | ------------------------------------ | --------------------------------------------- | ------ |
| TC-VP4402-11 | Màu header cột = màu thợ | Medium   | Đang ở Appointment Overview | Mọi cột có màu | 1. Đọc màu viền dưới header từng cột | = `staff.colorHex` (thợ không màu: xem TC-12) | ✅     |

## 3. Bug VP-5481 — màu cột trên POS không giống GAP

| TC ID        | Title                                                     | Priority | Precondition                                                    | Test Data                                                                                                                     | Steps                                                                      | Expected Result                                                                                                | Status |
| ------------ | --------------------------------------------------------- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP4402-12 | VP-5481: không cột thợ nào xám; thợ không màu = `#5669FF` | High     | Thợ cũ đã lưu lại trên GoCheckin; POS ≥ 1.1.115                 | Teri Jennings (vàng `#F8D885`), Lizzie Wade (`#A0AFF0`), Ramona Dunn (`#96BDF5`); thợ không màu: Shelby, JS, KKate, Phong001… | 1. Đọc màu header mọi cột                                                  | Teri/Lizzie/Ramona đúng màu GAP; không cột nào xám `#CDCCD2`; thợ `colorHex = null` hiển thị `#5669FF` như GAP | ✅     |
| TC-VP4402-13 | VP-5481: cột Unassigned màu xanh như GAP                  | Medium   | POS ≥ 1.1.115                                                   | Unassigned                                                                                                                    | 1. So màu header cột Unassigned                                            | Xanh `#5669FF` như GAP (trước fix: xám đậm `#4D4A5B`)                                                          | ✅     |
| TC-VP4402-14 | VP-5481: thợ Anna đúng màu GAP                            | Low      | Anna đã lưu lại trên GoCheckin                                  | Anna                                                                                                                          | 1. So màu cột Anna                                                         | Xanh `#96BDF5` như GAP. 06/11: đã đúng sau khi lưu lại trên GoCheckin                                          | ✅     |
| TC-VP4402-17 | VP-5481: card appointment Unassigned viền + nền xanh      | Medium   | Có appointment Unassigned trong 14 ngày gần nhất; POS ≥ 1.1.115 | Ngày gần nhất có appointment Unassigned (vd 11/05: QC E2E Wppvd 3:15 PM, 4:15 PM)                                             | 1. Lùi về ngày có appointment Unassigned. 2. Đọc mọi card ở cột Unassigned | Viền card `#5669FF`, nền pha 30% `#5669FF` (xanh nhạt)                                                         | ✅     |
| TC-VP4402-18 | VP-5481: badge số lượng mỗi cột cùng màu header           | Low      | POS ≥ 1.1.115                                                   | Mọi cột (Unassigned, thợ có màu, thợ không màu)                                                                               | 1. Đọc màu badge cạnh tên từng cột                                         | Badge = màu header cột (Unassigned và thợ không màu = `#5669FF`)                                               | ✅     |

## 4. So sánh trực tiếp với web GoCheckin (pos.gocheckin.net)

Spec mở web GoCheckin bằng web lane (Edge, `WEB_MERCHANT_ID` / `WEB_USERNAME` / `WEB_PASSWORD` trong `configs/env/.env.dev`), đọc lịch Appointment hôm nay (`th.fc-col-header-cell.fc-resource`: tên + màu từng cột, trái → phải) rồi so với board POS. Chỉ đọc, không tạo/sửa gì trên GoCheckin. Web spec: `tests/web/gap-appointment-board.spec.ts`.

| TC ID        | Title                                           | Priority | Precondition                            | Test Data                                        | Steps                                                                                                      | Expected Result                                                                                                                                    | Status |
| ------------ | ----------------------------------------------- | -------- | --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| TC-VP4402-19 | Thứ tự cột POS giống lịch Appointment GoCheckin | High     | Đăng nhập được GoCheckin web (store 14) | Mọi cột có trên cả 2 bên, tên không trùng        | 1. GoCheckin: đọc toàn bộ header cột. 2. POS: đọc toàn bộ header cột. 3. So thứ tự các cột chung           | Thứ tự giống hệt, Unassigned đứng đầu. Bỏ qua thợ `priority = 0` (VP-5479 Canceled: GoCheckin xếp đầu, POS xếp sau). Thợ chỉ có 1 bên được ghi log | ✅     |
| TC-VP4402-20 | Màu từng cột POS giống GoCheckin                | High     | Đăng nhập được GoCheckin web (store 14) | Mọi cột chung, kể cả Unassigned và thợ không màu | 1. Đọc màu header từng cột trên GoCheckin (màu chữ tên cột) và trên POS (viền dưới header). 2. So từng cột | Cùng mã màu `#RRGGBB` (Unassigned / thợ không màu = `#5669FF`)                                                                                     | ✅     |

## Kết quả test tay (02/11/2026, POS Windows 1.1.87)

Pass 5 / Fail 2 (TC-VP4402-05 → VP-5479, TC-VP4402-12 → VP-5481) — đã comment vào VP-4402.

## Kết quả 05–06/11/2026 (POS 1.1.101 → 1.1.107)

- 06/11: lưu lại 117 thợ cũ trên GoCheckin (Gap Settings → Staff → Save) → 272/272 thợ cùng màu GCI = POS; Anna đúng màu.
- VP-5479 Canceled theo dev; VP-5481 còn Unassigned + thợ không màu → Todo, assign Thien Duy.

## Automation

`npm run test:attach -- --spec tests/regression/appointment/vp-4402-staff-column-order-color.spec.ts` (hoặc `npm run test:spec -- <spec>`)
TC-12, TC-13 bỏ `@broken` 10/11 (VP-5481 đã fix trên 1.1.115). TC-17, TC-18 thêm 10/11 cho phần card + badge của VP-5481.
07/11/2026: bỏ 6 TC skip theo yêu cầu user — TC-05 (VP-5479 Canceled), TC-08/09/10 (card appointment, thiếu dữ liệu), TC-15/16 (không tự động được). Không đánh số lại các TC còn lại.

### Lần chạy 07/11/2026 — POS 1.1.107, store 14 (attach lane), sau khi bỏ 6 TC skip

**8 PASS / 2 FAIL / 0 SKIP** (10 TC)

| TC ID        | Kết quả         | Ghi chú                                                                                                                            |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TC-VP4402-01 | PASS            | 1.1.107 ≥ 1.1.87                                                                                                                   |
| TC-VP4402-02 | PASS            | thứ tự cột = `staff_appointment`                                                                                                   |
| TC-VP4402-03 | PASS            | 1001vvv (priority 0) sau mọi thợ có thứ tự — đúng logic hiện tại                                                                   |
| TC-VP4402-04 | PASS            | thợ không có row nằm cuối                                                                                                          |
| TC-VP4402-06 | PASS            | dropdown Staffs A→Z                                                                                                                |
| TC-VP4402-07 | PASS            | thứ tự cột không đổi khi sang ngày mai                                                                                             |
| TC-VP4402-11 | PASS            | header = `staff.colorHex` cho mọi thợ có màu                                                                                       |
| TC-VP4402-12 | FAIL 🐞 VP-5481 | 25 cột còn xám `#CDCCD2` (24 thợ không màu + JD POS-only): taff 12347, Shelby, JS, JDD, JSS, JD1119, …, KKate, WWave, Phong001, JD |
| TC-VP4402-13 | FAIL 🐞 VP-5481 | Unassigned `#4D4A5B`, mong đợi `#5669FF`                                                                                           |
| TC-VP4402-14 | PASS            | Anna `#96BDF5`                                                                                                                     |

### Lần chạy 10/11/2026 — POS 1.1.115 (bản mới nhất trên feed), store 14

`npm run test:spec -- tests/regression/appointment/vp-4402-staff-column-order-color.spec.ts`

**14 PASS / 0 FAIL / 0 SKIP** (14 TC, gồm TC-19/20 so trực tiếp với web GoCheckin) — VP-5481 đã fix (volt-pos#3406).

| TC ID        | Kết quả | Ghi chú                                                                                                                                                                                                                                                                   |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-VP4402-01 | PASS    | 1.1.115                                                                                                                                                                                                                                                                   |
| TC-VP4402-02 | PASS    | thứ tự cột = `staff_appointment`                                                                                                                                                                                                                                          |
| TC-VP4402-03 | PASS    |                                                                                                                                                                                                                                                                           |
| TC-VP4402-04 | PASS    |                                                                                                                                                                                                                                                                           |
| TC-VP4402-06 | PASS    |                                                                                                                                                                                                                                                                           |
| TC-VP4402-07 | PASS    |                                                                                                                                                                                                                                                                           |
| TC-VP4402-11 | PASS    |                                                                                                                                                                                                                                                                           |
| TC-VP4402-12 | PASS    | không cột nào xám; 25 thợ không màu = `#5669FF`                                                                                                                                                                                                                           |
| TC-VP4402-13 | PASS    | Unassigned `#5669FF`                                                                                                                                                                                                                                                      |
| TC-VP4402-14 | PASS    | Anna `#96BDF5`                                                                                                                                                                                                                                                            |
| TC-VP4402-17 | PASS    | board 11/05: 2 card Unassigned viền `#5669FF`, nền xanh nhạt                                                                                                                                                                                                              |
| TC-VP4402-18 | PASS    | badge mọi cột = màu header                                                                                                                                                                                                                                                |
| TC-VP4402-19 | PASS    | GoCheckin 301 cột / POS 306 cột, so 296 cột chung: cùng thứ tự. Bỏ qua 1001vvv (priority 0, VP-5479 Canceled). Chỉ có trên GoCheckin: ZZruleAlpha, ZZ rule Space, ZZrule2Digit, A. Chỉ có trên POS: 333, abc xyz30, Bell, Ben, Delete, Elise Terry, Emma2, JD, TestSalary |
| TC-VP4402-20 | PASS    | so màu 297 cột chung (kể cả Unassigned, thợ không màu): 0 cột khác màu                                                                                                                                                                                                    |

Lần chạy đầu TC-17 FAIL do lỗi spec (probe bỏ qua card có `border-color: var(…)`) — đã sửa `AppointmentBoardProbe.cardsInColumn`.
