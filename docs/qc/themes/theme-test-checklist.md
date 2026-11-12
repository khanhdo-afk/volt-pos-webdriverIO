# Checklist test 4 theme Volt POS (tính năng + UX/UI)

Ngày lập: 12/11/2026 · Môi trường: dev tiệm 14 · Thứ tự: **Classic (chuẩn so sánh) → Spring → Summer → Winter**

**Oracle:** theme chỉ đổi giao diện. Tiền, trạng thái order, turn, tip, batch, lịch hẹn phải giống hệt Classic. Theme lưu riêng từng máy.

**Cách ghi ô:** `F:✅ U:✅` = tính năng PASS, UI PASS · `F:❌ VP-xxxx` = FAIL kèm mã bug · `—` = không áp dụng · để trống = chưa test.

| Theme              | Project Linear    | Version build | Ngày test |
| ------------------ | ----------------- | ------------- | --------- |
| Volt POS (Classic) | —                 |               |           |
| Volt Spring        | GoPOS Theme       |               |           |
| Volt Summer        | MAC USA POS Theme |               |           |
| Volt Winter        | Zota POS Theme    |               |           |

---

## A. Chuẩn bị trước khi test

| #   | Hạng mục         | Chi tiết                                                                                                                                                                                                                                            | Xong |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| A1  | Build            | Bản dev mới nhất trên feed; ghi version trước mỗi theme                                                                                                                                                                                             | ☐    |
| A2  | Đăng nhập        | Quét QR đăng nhập lại app; CDP 9222 (TeamViewer chiếm → 9223)                                                                                                                                                                                       | ☐    |
| A3  | Dữ liệu tiệm 14  | ≥ 6 thợ (đang làm / rảnh / chưa check-in), ≥ 3 nhóm thợ, dịch vụ + product, khách có điểm, gift card active / inactive / số dư thấp, ≥ 3 lịch hẹn hôm nay (Assigned + Unassigned), ≥ 2 check-in từ web, đơn pending, đơn đã trả cash / card / split | ☐    |
| A4  | Card             | Terminal sẵn sàng; charge thật chỉ 0.01–0.50 USD                                                                                                                                                                                                    | ☐    |
| A5  | Màn khách        | Cửa sổ màn khách mở được                                                                                                                                                                                                                            | ☐    |
| A6  | Độ phân giải     | 1920×1080 và 2K (thêm 1366×768 nếu kịp)                                                                                                                                                                                                             | ☐    |
| A7  | Classic baseline | Chụp ảnh từng màn ở Classic để đối chiếu                                                                                                                                                                                                            | ☐    |
| A8  | Reset            | Cuối buổi trả về Volt POS (Classic)                                                                                                                                                                                                                 | ☐    |

## B. Tiêu chí UX/UI (áp cho mọi màn)

| #   | Tiêu chí                | Cách kiểm                                                                                                                       | Bug đã có                 | Classic | Spring | Summer | Winter |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------- | ------ | ------ | ------ |
| B1  | Token theme phủ đủ      | Nền, panel, header, sidebar, dialog, toast, dropdown, calendar, combobox, switch đổi theo theme; không còn mảng màu Classic lạc |                           |         |        |        |        |
| B2  | Tương phản chữ          | Chữ, placeholder, nhãn trục biểu đồ, số tiền đọc được                                                                           | VP-6843, VP-6862          |         |        |        |        |
| B3  | Icon                    | Hiện đủ, không mờ / mất                                                                                                         | VP-6839, VP-6846          |         |        |        |        |
| B4  | Trạng thái control      | Switch on/off, radio, checkbox, tab đang chọn, nút disabled phân biệt rõ                                                        | VP-6842, VP-6976          |         |        |        |        |
| B5  | Bố cục                  | Không cắt chữ, không tràn, không thanh cuộn ngang lạ, nút không dính mép                                                        | VP-6840, VP-6841, VP-6845 |         |        |        |        |
| B6  | Dialog                  | Vừa màn, nút chính không bị che, tiêu đề không trống                                                                            | VP-6860, VP-6861          |         |        |        |        |
| B7  | Phản hồi chạm           | Pressed / hover / focus có highlight; vùng chạm đủ lớn                                                                          |                           |         |        |        |        |
| B8  | Đa độ phân giải         | Không dồn nội dung, không khoảng trống lớn                                                                                      | VP-6978                   |         |        |        |        |
| B9  | Dark mode / Tile Colors | Theme + Dark mode bật / tắt; Tile Colors Bold / Pastel                                                                          |                           |         |        |        |        |
| B10 | Nhất quán + ngôn ngữ    | Cùng loại nút cùng kiểu; EN / VI không vỡ layout                                                                                |                           |         |        |        |        |

## B+. UX/UI theo từng loại control (soi ở mọi màn có control đó)

Mỗi control kiểm đủ các trạng thái: **mặc định · hover · focus · pressed · selected · disabled · lỗi (error) · placeholder · rỗng · chữ dài**. Màu lấy theo token theme, không còn màu Classic.

| #   | Control                                                              | Kiểm UX/UI                                                                                                                                             | Classic | Spring | Summer | Winter |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------ | ------ | ------ |
| U1  | Text field (tên, note 80 / 255, email)                               | Viền + nền đúng theme; placeholder đọc được; focus ring rõ; lỗi validate hiện màu đỏ + chữ dưới field; đếm ký tự; chữ dài không tràn; nút xoá (×) hiện |         |        |        |        |
| U2  | Ô số / tiền + bàn phím số                                            | Số căn phải, định dạng $; keypad C / ⌫ / preset đủ tương phản; nút đang bấm có highlight; giá trị âm / quá lớn báo lỗi rõ                              |         |        |        |        |
| U3  | Ô SĐT + keypad khách                                                 | Mask (xxx) xxx-xxxx; nút disabled khi chưa đủ số; trạng thái disabled phân biệt rõ (VP-6976)                                                           |         |        |        |        |
| U4  | Ô search                                                             | Icon kính lúp; placeholder; kết quả rỗng có empty state; xoá nhanh                                                                                     |         |        |        |        |
| U5  | Combobox / select (Country, State, Staff, kỳ lương, preset ngày)     | Nút mở có mũi tên; list không bị cắt, cuộn được; mục đang chọn có dấu ✓ / nền; placeholder đọc được (VP-6862); gõ để lọc; list không bị panel che      |         |        |        |        |
| U6  | Dropdown / popover (Sort, Filter thợ, menu ⋮ / ≡)                    | Đủ rộng cho nhãn (VP-7139 #9); có bóng / viền tách nền; đóng khi bấm ngoài; mục được chọn nổi bật                                                      |         |        |        |        |
| U7  | Calendar / date picker (1 tháng, 2 tháng, khoảng ngày, dropdown năm) | Ngày hôm nay, ngày chọn, khoảng chọn khác màu rõ; ngày khoá (tương lai) mờ; nút Prev / Next; tiêu đề tháng đọc được; không bị cắt cạnh                 |         |        |        |        |
| U8  | Time picker / đồng hồ 3 bánh xe                                      | Giá trị giữa nổi bật; bánh xe cuộn mượt; AM / PM rõ                                                                                                    |         |        |        |        |
| U9  | Switch                                                               | Nhìn rõ on / off (có nút gạt, màu khác) — VP-6842                                                                                                      |         |        |        |        |
| U10 | Checkbox / radio                                                     | Dấu tick / chấm rõ; nhãn bấm được; trạng thái disabled                                                                                                 |         |        |        |        |
| U11 | Tab / pill / segmented                                               | Tab đang chọn nổi bật; số đếm (badge) đọc được; không xuống dòng                                                                                       |         |        |        |        |
| U12 | Nút chính / phụ / nguy hiểm                                          | Phân cấp rõ (Primary / Secondary / Danger); icon + nhãn đủ; không dính mép (VP-6840 / 6841); disabled mờ đúng; loading spinner khi xử lý               |         |        |        |        |
| U13 | Tile / card (thợ, dịch vụ, tender, order)                            | Màu Tile Colors Bold / Pastel; card chọn có viền / badge (VP-6845); chữ không bị cắt; icon hiện (VP-6839)                                              |         |        |        |        |
| U14 | Chip / badge / status                                                | Màu trạng thái (Paid, Pending, Cancel, Refund) đúng; không dính nhau (VP-7139 #11)                                                                     |         |        |        |        |
| U15 | Stepper (+ / −)                                                      | Nút đủ lớn; giá trị giữa đọc được; disabled ở min / max                                                                                                |         |        |        |        |
| U16 | Dialog / modal                                                       | Vừa màn; tiêu đề không trống (VP-6861); nút Confirm / Cancel không bị che (VP-6860); overlay tối nền; đóng bằng × / Esc                                |         |        |        |        |
| U17 | Passcode dialog                                                      | Chấm nhập rõ; báo sai passcode; keypad đúng theme                                                                                                      |         |        |        |        |
| U18 | Toast / thông báo / banner                                           | Icon đúng cỡ, căn giữa (VP-6846); màu theo loại (success / error / warning); tự ẩn; không che nút                                                      |         |        |        |        |
| U19 | Bảng / list (OH, Pending, Report, Time Tracking)                     | Header thẳng cột (VP-6844); dòng xen màu / hover; cuộn vô hạn; empty state; số tiền căn phải                                                           |         |        |        |        |
| U20 | Kéo thả (By Items, Tipping, Screen layout)                           | Bóng mờ khi kéo; vùng thả highlight                                                                                                                    |         |        |        |        |
| U21 | Ô chữ ký                                                             | Nền ký tương phản nét; nút Clear / Done                                                                                                                |         |        |        |        |
| U22 | Biểu đồ (Daily Sale, Income Summary, V4)                             | Nhãn trục, legend, tooltip đọc được (VP-6843)                                                                                                          |         |        |        |        |
| U23 | Loading / skeleton / empty / lỗi mạng                                | Có trạng thái chờ; màn trống có icon + chữ (VP-6844)                                                                                                   |         |        |        |        |
| U24 | Thanh cuộn                                                           | Không có cuộn ngang lạ (VP-6845); cuộn dọc nhìn thấy trên nền theme                                                                                    |         |        |        |        |
| U25 | Header / sidebar / dock / nút tròn                                   | Icon + nhãn rõ; mục đang mở nổi bật; đồng hồ đọc được                                                                                                  |         |        |        |        |

### Bản đồ control theo màn (quét theo thứ tự này)

| Màn                                            | Control phải soi                                                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login / Splash                                 | U1 (passcode), U12, U23                                                                                                                          |
| Header / Sidebar / Dock                        | U25, U6 (menu ≡ / ⋮), U11 (badge Pending)                                                                                                        |
| Home / Create Order                            | U4 search thợ / dịch vụ, U11 tab nhóm, U6 sort, U13 tile thợ + dịch vụ, U3 keypad SĐT khách, U1 Order Note, U16 Quick Pay / Merge / xoá đơn, U17 |
| Sửa dòng                                       | U2 giá, U1 note 80, U11 %/$, U12 Change / Remove staff                                                                                           |
| Checkout                                       | U11 tab tender, U2 keypad + preset, U1 tên Other 255, U1 mã gift card, U13 tile tender, U21 chữ ký, U17, U16 lỗi card, U12 Complete, U18         |
| Payment Successful                             | U12 SMS / Email / Print, U1 email, U3 SĐT                                                                                                        |
| Split Order / Split Tip                        | U11 Equally / Amount / Items, U2 keypad, U20 kéo thả, U16 Void (U1 lý do 80), U10                                                                |
| Màn khách                                      | U3 keypad + U10 consent, U12 Yes / No, U13 tip %, U2 Custom tip, U21, U23                                                                        |
| Promo / Gift card                              | U1 số thẻ, U2 preset + custom, U10 Owner / Staff split, U13 campaign                                                                             |
| Pending Orders                                 | U4, U6 lọc thợ + sort, U7 khoảng ngày + 8 preset, U13 card, U16 xoá                                                                              |
| Order History                                  | U17, U4, U7 lịch 2 tháng, U16 Filter (U10 / U5), U19, U14, U16 Cancel (U10 7 lý do) / Refund (U2) / Adjust Tip (U2)                              |
| Re-Open                                        | U16 Change Staff, U18 thông báo khoá món, U12 Continue / Done                                                                                    |
| Appointment                                    | U12 Prev / Next / Now, U7 1970–2030, U6 lọc Staffs / Statuses, U13 card hẹn + màu cột, U16 popover                                               |
| Time Keeping / Tracking                        | U5 Staff, U7 ngày IN / OUT, U8 đồng hồ, U1 note 255, U19, U16 Edit / Delete, U23                                                                 |
| Turn board                                     | U6 sort 4 lựa chọn, U7 + dropdown năm, U15 stepper, U9 / U10 Turn Settings                                                                       |
| Report / Incomes                               | U5 10 preset ngày, U11 Day / Week / Month, U7 custom range, U5 kỳ lương, U19, U22, U12 Print All, U15 font size                                  |
| Settings › Business                            | U1, U5 Country / State, U8 giờ làm, U9                                                                                                           |
| Settings › Services & Products / Employees     | U4, U1, U2 giá, U5 Staff Group (VP-6862), U11 5 tab, U9, U16                                                                                     |
| Settings › Roles / Permissions                 | U9 (108 switch — VP-6842), U10                                                                                                                   |
| Settings › Tipping / Charge & Fee / Receipt    | U19 bảng tip, U20 kéo thả, U2 %, U9, preview receipt                                                                                             |
| Settings › Accessibility / Passcode / Language | U9, U10, U5 ngôn ngữ                                                                                                                             |
| Settings › Themes / Screen layout              | U13 card theme (VP-6973), U14 In Use, U11 Desktop / Handheld, U20 sắp xếp, U12 Save                                                              |
| Remote Support / Devices                       | U16, U12 Allow / Decline / End, U10 View only / operate, U18 banner                                                                              |

## C. Phần chung (~1.800 TC tự động + soi UI)

| #   | Màn / tính năng          | Kiểm tra chức năng                                                                                                                                                                                     | Điểm soi thêm khi đổi theme                                                                 | Classic | Spring | Summer | Winter |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------- | ------ | ------ | ------ |
| C1  | Khung app                | Splash, 2 cửa sổ, nút header, 12 mục sidebar, Reload App, Version Update, phím tắt                                                                                                                     | Header / sidebar khoác token                                                                |         |        |        |        |
| C2  | Home / Order / Giỏ       | Tìm thợ, tab nhóm, sort, ô dịch vụ, tìm dịch vụ, sửa dòng (giá, note 80, giảm %/$), Quick Pay, keypad SĐT, thêm khách nhanh, đổi / xoá thợ, Merge, Order Note, xoá đơn (passcode), Global Search 4 tab | Bố cục riêng theme vẫn nối đúng tính năng                                                   |         |        |        |        |
| C3  | Checkout                 | Card / Cash / Other / Gift, preset, keypad, tiền thối, gift card (inactive, thiếu số dư, nhiều thẻ), Card + chữ ký, Service Fee / Tax, tip, passcode Complete, Payment Successful (SMS / Email)        | Cash thiếu tiền phải có Remaining (VP-7104); Card charge = tổng có tax (VP-6975)            |         |        |        |        |
| C4  | Split Order / Split Tip  | Equally / By Amount / By Items, tối đa 5 check, trả từng check, Void check, Split Tip Evenly / Proportion / Manual                                                                                     |                                                                                             |         |        |        |        |
| C5  | Màn khách                | Giỏ phản chiếu, keypad SĐT, xác nhận số, tip, chữ ký, Payment complete, điểm                                                                                                                           | Đổi theo theme (THEME-05)                                                                   |         |        |        |        |
| C6  | Promo / Gift card / Điểm | Custom Discount, campaign, bán gift card (preset, custom, bonus, top-up), Checkout Type Manual / Auto / Hybrid                                                                                         |                                                                                             |         |        |        |        |
| C7  | Pending Orders           | Search, lọc thợ, sort, lịch khoảng ngày, Quick Checkout, xoá, sync check-in web, Default Screen                                                                                                        |                                                                                             |         |        |        |        |
| C8  | Order History            | Passcode, list, search, lịch 2 tháng, Filter, chi tiết, Cancel, Refund, Adjust Tip, Split Tip, Re-print                                                                                                |                                                                                             |         |        |        |        |
| C9  | Re-Open Order            | Re-Open cash / other / card / split, đổi thợ, khoá sửa món, Continue Re-open, Re-Open Done, không cộng điểm 2 lần                                                                                      | Re-Open lần 2 có thông báo khoá món (VP-7141); Change Staff không mở dialog thứ 2 (VP-7140) |         |        |        |        |
| C10 | Appointment              | Prev / Next / Now, lịch chọn ngày, lọc Staffs / Statuses, cột thợ + màu, Checkout từ lịch hẹn                                                                                                          |                                                                                             |         |        |        |        |
| C11 | Time Keeping / Tracking  | Check In / Out, combobox thợ, ngày + đồng hồ, Edit / Delete, khoá kỳ lương                                                                                                                             | Màn VOLT khoác token (VP-6844)                                                              |         |        |        |        |
| C12 | Turn board               | Dropdown sort, lịch + dropdown năm, chỉnh turn tay, Turn Settings                                                                                                                                      |                                                                                             |         |        |        |        |
| C13 | Report / Incomes         | Daily Sale, Income Summary (10 preset), Staff Income, Payroll, Batch History, Report V4, Print All                                                                                                     | Chart đọc được (VP-6843)                                                                    |         |        |        |        |
| C14 | Settings                 | Business, Services & Products, Employees, Roles, Permissions, Tipping, Charge & Fee, Receipt, Accessibility / Passcode, Language, Themes                                                               | Switch / select trên nền theme (VP-6842, VP-6862)                                           |         |        |        |        |
| C15 | Hành trình E2E           | Lỗi card / passcode, điểm → Daily Sale, setting → màn khách + receipt                                                                                                                                  |                                                                                             |         |        |        |        |
| C16 | Toast                    | Thông báo hiện đúng, icon đúng cỡ, căn giữa                                                                                                                                                            | VP-6846                                                                                     |         |        |        |        |

## D. Riêng từng theme

### D1. Volt Spring (GoPOS)

| #    | Hạng mục                | Kiểm tra                                                           | Bug đã có                 | Kết quả |
| ---- | ----------------------- | ------------------------------------------------------------------ | ------------------------- | ------- |
| D1.1 | Thanh trên + pill       | Pending / Appointments / Unassigned lọc và đếm đúng                |                           |         |
| D1.2 | Quick Checkout          | Dialog Skip · Walk-in; nút Done không bị che                       | VP-6860                   |         |
| D1.3 | Customer picker         | Tìm, Add, Done, xem điểm                                           |                           |         |
| D1.4 | Ô Customer Phone        | Disabled hay dùng được, nhìn đúng trạng thái                       | VP-6976                   |         |
| D1.5 | Ticket                  | Staff / Service; Back / Add More Staff / Merge Order / Split Order | VP-7139 #7                |         |
| D1.6 | Payment                 | Card / Cash / Gift / Check / Other; Exact, Change, Remaining       | VP-7104, VP-6861, VP-6978 |         |
| D1.7 | Checkout từ Appointment | Mở đúng order, tiền khớp Classic                                   |                           |         |
| D1.8 | Re-Open                 | Đổi thợ, khoá món lần 2                                            | VP-7140, VP-7141          |         |

### D2. Volt Summer (MAC USA)

| #    | Hạng mục            | Kiểm tra                                                                                 | Bug đã có           | Kết quả |
| ---- | ------------------- | ---------------------------------------------------------------------------------------- | ------------------- | ------- |
| D2.1 | Cột Check-in Today  | Edit / Pay / ≡ Start Order, Assign Staff, menu thẻ đủ rộng                               | VP-7066             |         |
| D2.2 | Cột Today Appt      | Danh sách đúng ngày, mở order                                                            |                     |         |
| D2.3 | Cột Staff           | PAY, «N Pending», đồng hồ                                                                |                     |         |
| D2.4 | Nút tròn            | Search / Free / Turns / Pending                                                          |                     |         |
| D2.5 | Dock phải           | More Action / Quick Checkout / Appointment / Pending / History / Search mở đúng màn VOLT |                     |         |
| D2.6 | Ticket              | Danh mục, dịch vụ, Save / Delete Ticket, Unpaid, Split; Change Staff, sort               | VP-6839, VP-7139 #2 |         |
| D2.7 | Tile thanh toán     | Card / Cash / Gift / Other / Tip / Tip Split / Discount / Promo / Receipt                | VP-6839, VP-6840    |         |
| D2.8 | Order History riêng | Danh sách, chi tiết, màn Paid + Tip Split                                                | VP-6841, VP-7139 #1 |         |
| D2.9 | Appointment riêng   | Cột Everyone / Unassigned                                                                | VP-7139 #3          |         |

### D3. Volt Winter (Zota)

| #     | Hạng mục                   | Kiểm tra                                                              | Bug đã có                          | Kết quả |
| ----- | -------------------------- | --------------------------------------------------------------------- | ---------------------------------- | ------- |
| D3.1  | Header                     | WAIT / APPT BOOK / FAST SALE; menu ☰                                 | VP-7139 #5, #6                     |         |
| D3.2  | QUEUE                      | Chạm thợ → passcode → mở Ticket                                       |                                    |         |
| D3.3  | Tab SERVICE / TURN DETAILS | Nội dung đúng, turn khớp Classic                                      |                                    |         |
| D3.4  | Tab WAITING LIST           | Chạm khách để chọn thợ                                                |                                    |         |
| D3.5  | Tab APPT TODAY             | CHECK OUT, «#mã» mở order                                             |                                    |         |
| D3.6  | Tab CLOSED TICKET          | Danh sách đơn đã trả                                                  |                                    |         |
| D3.7  | NEW TICKET                 | Nghi bug: bấm không phản ứng — xác nhận                               |                                    |         |
| D3.8  | Ticket 2 cột               | Tab Services / Queue, Promo & Rewards, Note, COMBINE                  | VP-6845                            |         |
| D3.9  | Sửa dòng                   | TRANSFER / QUANTITY / CHANGE PRICE / DISCOUNT ITEM / NOTE / VOID ITEM |                                    |         |
| D3.10 | Payment                    | Exact, tender CHECK, LOYALTY                                          |                                    |         |
| D3.11 | Order History riêng        | Màn Paid + Split Tip                                                  | VP-7139 #4                         |         |
| D3.12 | Màn VOLT trên glass        | Report chart, Time Tracking, Settings switch, select placeholder      | VP-6842, VP-6843, VP-6844, VP-6862 |         |

### D4. Volt POS (Classic)

Chạy full suite làm baseline. Lỗi chỉ xuất hiện ở theme khác mới log là bug theme.

## E. Tính năng chung còn thiếu test (spec mới, chạy ở 4 theme)

| #    | Tính năng                       | Kiểm tra                                                                                                                                                                                          | Bug đã có                                              | Classic | Spring | Summer | Winter |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------- | ------ | ------ | ------ |
| E1   | Settings › Themes               | Chọn theme, nhãn In Use, giữ sau reload + relaunch, áp cho màn khách, card đọc được                                                                                                               | VP-6973, VP-7139 #8                                    |         |        |        |        |
| E2   | Settings › Screen layout        | Tab Desktop / Handheld; sắp xếp Home panels / Ticket quick actions / Checkout action bar / Order history toolbar / Payment methods; Save → thứ tự hiện đúng                                       | VP-7139 #12                                            |         |        |        |        |
| E3   | Remote Support                  | Xem code, View only / View and operate, Allow / Decline, End                                                                                                                                      |                                                        |         |        |        |        |
| E4   | Devices                         | Trạng thái đầu đọc thẻ, banner quyền truy cập thiết bị                                                                                                                                            |                                                        |         |        |        |        |
| E5   | Card charge recovered           | Thông báo khôi phục giao dịch thẻ gián đoạn                                                                                                                                                       |                                                        |         |        |        |        |
| E6   | Loyalty tender                  | Trừ điểm đúng, đơn lưu đúng tender                                                                                                                                                                |                                                        |         |        |        |        |
| E7   | Split Tip trong OH detail       | Mở được, chia đúng                                                                                                                                                                                |                                                        |         |        |        |        |
| E8   | Default Screen + Report V4 Live | Handheld Default Screen; V4 "Live" cập nhật                                                                                                                                                       |                                                        |         |        |        |        |
| E9   | Màn khách theo theme            | Đổi màu / layout theo theme (`data-theme-pack` trên cửa sổ `/customer/`)                                                                                                                          | THEME-05 (nghi); 12/11: Summer → màn khách vẫn Classic |         |        |        |        |
| E9.1 | Màn khách › Welcome             | Tên tiệm, logo thanh toán, nền; soi UI                                                                                                                                                            |                                                        |         |        |        |        |
| E9.2 | Màn khách › Giỏ hàng            | Phản chiếu dòng dịch vụ / thợ / giá / giảm giá / tax / fee / tổng khớp màn staff                                                                                                                  |                                                        |         |        |        |        |
| E9.3 | Màn khách › Nhập SĐT            | Keypad, mask SĐT, consent, Yes / No, "No, enter again" (VP-5195 / 5711)                                                                                                                           |                                                        |         |        |        |        |
| E9.4 | Màn khách › Tip                 | No Tip / % / Custom Tip / Continue; số tip về đúng màn staff                                                                                                                                      |                                                        |         |        |        |        |
| E9.5 | Màn khách › Chữ ký              | Ô ký, Clear / Accept, chữ ký lên receipt                                                                                                                                                          |                                                        |         |        |        |        |
| E9.6 | Màn khách › Payment complete    | Tổng đã trả, điểm cộng / Show Point / Show Reward theo Accessibility                                                                                                                              |                                                        |         |        |        |        |
| E10  | Route ít dùng                   | Gift Card, Menu, Orders, Back-office batch / layout, View Cart; Cash Drawer chỉ là trang demo (nút ẩn ở prod) → chỉ kiểm quyền + gate Open Cash Drawer                                            |                                                        |         |        |        |        |
| E11  | Scanner (nút header)            | Mở dialog camera; nhập mã tay; mã rỗng / sai; QR receipt → mở order đã trả; QR pending → Home; mã gift card → Confirm → lịch sử GC → Add Funds; đóng dialog; camera bị chặn; UI dialog theo theme | VP-6861 (Scan QR – Spring)                             |         |        |        |        |

## I. Chi tiết màn bổ sung (quét bù 12/11)

Nguồn: ảnh Settings dev 1.1.120 + `docs/qc/volt-qc/windows-regression/01, 09, 11, 12-*.md` + `docs/screens`. Khi test sẽ attach app thật (CDP 9223) để đối chiếu route.

**Header dev 1.1.120:** ≡ · logo · Pending Orders · Order History · Appointment · Scanner · Search… · Devices · đồng hồ (Time Keeping) · chuông · badge DEV.

### I1. Settings — 12 trang, 5 nhóm (footer: Version, Device ID → QR popover, Support)

| #     | Nhóm              | Trang                                                 | Control + tính năng cần kiểm                                                                                                                                                                                                                                                                                                                               | Classic             | Spring | Summer | Winter |
| ----- | ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ | ------ | ------ |
| I1.1  | Store & Account   | Business Info                                         | Passcode gate + checkbox "30 phút"; Edit / refresh / Save / Cancel; Business Name, Legal Name, Business phone (read-only); Website (URL), Address (bắt buộc, 50), **Country / State combobox** (State xoá khi đổi Country), City (50), Zip (5); toast cập nhật; dialog rời trang khi chưa lưu                                                              |                     |        |        |        |
| I1.2  |                   | Business Info › Work Hours                            | 7 switch ngày + 2 **time picker**; Off → "Closed"; lỗi "Open time must be before close time"                                                                                                                                                                                                                                                               |                     |        |        |        |
| I1.3  |                   | Business Info › Pay Period / Brand / Policies         | Radio Weekly / Biweekly / Monthly / Custom + popover chọn ngày (tối đa 4) + dialog áp kỳ này / kỳ sau; Store Logo / Cover Photo (Add Image); 3 textarea Liability / Cancellation / Other                                                                                                                                                                   |                     |        |        |        |
| I1.4  | Service & Staff   | Services & Products                                   | Tab Active / Inactive; +; dialog Reorder (tab Category / All services, kéo thả); dialog Category (50, trùng tên, tên cấm); Add New Item: Name 50, Category, Price (khoá khi Flexible Pricing), Supply Fee, Duration (giờ 0–8, phút bước 5), Description 255, Status, switch Web Booking / Go Checkin / Go POS; switch Active trong bảng; Products tương tự |                     |        |        |        |
| I1.5  | Employees Mgmt    | Employees › list                                      | Search, filter All / Active / Inactive, Reorder, Create New Staff (Nick Name, Staff Code 4 số duy nhất, Role)                                                                                                                                                                                                                                              |                     |        |        |        |
| I1.6  |                   | Employees › Information                               | First / Last Name 255, Nick Name, Email (sai / trùng), SSN, **Staff Group select** (VP-6862), Staff Code, Phone, Role (cảnh báo reset quyền), địa chỉ + Country / State, switch Appointment Staff, Color                                                                                                                                                   |                     |        |        |        |
| I1.7  |                   | Employees › Compensation                              | Radio Commission / Commission + Salary / Salary; % Service / Product / Gift Card; Pay 1-2; Deduction; Card Fee; switch Exclude Tips; Days Off (checkbox, số ngày, nút Mon–Sun); dialog xác nhận ảnh hưởng payroll                                                                                                                                          |                     |        |        |        |
| I1.8  |                   | Employees › Service Skills / Work Hours / Permissions | Checkbox theo danh mục; 7 switch + Sync with Business Hours; Extra Permission switch, Expand All; Save chung + cảnh báo đổi tab khi chưa lưu                                                                                                                                                                                                               |                     |        |        |        |
| I1.9  |                   | Roles                                                 | 4 role + màu + Members Count; dialog Assign (search, checkbox, Assign chỉ bật khi đổi) + confirm reset quyền                                                                                                                                                                                                                                               |                     |        |        |        |
| I1.10 |                   | Permissions                                           | Ma trận Owner / Manager / Partner / Staff (Owner khoá), 5 nhóm 16 quyền, Expand / Collapse All, Select / Unselect All cột, lưu ngay                                                                                                                                                                                                                        | VP-6842 (Winter)    |        |        |        |
| I1.11 | Payment & Receipt | Tipping Settings                                      | Tip Method checkbox 4; Tip Timing radio; Tip Amount %/$; bảng Tip Option (kéo thả, switch, edit / delete + confirm); dialog Add Tip Option (0 / rỗng / trùng); Signature switch + radio; Split Tip radio + Save riêng; dialog Continue Editing / Discard & Leave                                                                                           |                     |        |        |        |
| I1.12 |                   | Charge & Fee                                          | Product Tax % (0–100, keypad ảo); Service Tax read-only; Discount owner + staff = 100 + Save; Turn Settings 2 switch (decimal khoá khi switch 1 tắt) + giá trị $                                                                                                                                                                                           |                     |        |        |        |
| I1.13 |                   | Receipt                                               | Form trái + Receipt Preview phải; accordion Printing Preference, Logo & Branding (Choose file), Receipt Message (Header / Footer / Marketing + switch, 512), Display Options; Save chỉ bật khi đổi                                                                                                                                                         | VP-6842 (Winter)    |        |        |        |
| I1.14 | General           | Accessibility                                         | Switch bàn phím ảo; 14 passcode gate + Active All + Save; Customer Display Show Point / Show Reward; Default Screen; Tile Colors Bold / Pastel; Appearance Light / Dark (nếu có)                                                                                                                                                                           | VP-6842 (Winter)    |        |        |        |
| I1.15 |                   | Language                                              | Radio card English / Tiếng Việt, áp ngay; màn khách giữ English                                                                                                                                                                                                                                                                                            |                     |        |        |        |
| I1.16 |                   | Themes                                                | = E1                                                                                                                                                                                                                                                                                                                                                       | VP-6973, VP-7139 #8 |        |        |        |
| I1.17 |                   | Screen layout                                         | = E2                                                                                                                                                                                                                                                                                                                                                       | VP-7139 #12         |        |        |        |

### I2. Time Keeping (đồng hồ header / sidebar, không passcode) — ~39 TC

| #    | Kiểm                                                                            | Classic | Spring | Summer | Winter |
| ---- | ------------------------------------------------------------------------------- | ------- | ------ | ------ | ------ |
| I2.1 | Search staff; empty "No staff found."                                           |         |        |        |        |
| I2.2 | Thẻ Unavailable (badge đỏ, A→Z) / Available (badge xanh, IN mới nhất trước)     |         |        |        |        |
| I2.3 | Tile thợ IN / OUT + giờ; chọn tile → nút Check In / Check Out; toast thành công |         |        |        |        |
| I2.4 | Luật: đang IN không check in lại; tự out 11:59 PM; tile khoá khi ca đã đóng     |         |        |        |        |

### I3. Time Tracking (/time-tracking, passcode + quyền View Time Tracking) — ~85 TC

| #    | Kiểm                                                                                                                   | Bug đã có | Classic | Spring | Summer | Winter |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ------- | ------ | ------ | ------ |
| I3.1 | Passcode gate "Enter staff code to access Time Tracking"                                                               |           |         |        |        |        |
| I3.2 | Date preset (Today … Last Year) + Custom (lịch khoảng ngày); search; nút +                                             |           |         |        |        |        |
| I3.3 | Bảng #, Staff, Date IN, Date OUT, Total Hours, Created / Updated At, Note, Action; cuộn 15 dòng; empty state           | VP-6844   |         |        |        |        |
| I3.4 | Dialog Add / Edit: Staff combobox có search (khoá khi Edit), Date IN / OUT = date picker + đồng hồ 3 bánh xe, Note 255 |           |         |        |        |        |
| I3.5 | Lỗi: OUT trước IN; khác ngày; chồng giờ; khoá kỳ lương (bản ghi khoá read-only, Delete disabled)                       |           |         |        |        |        |
| I3.6 | Dialog Delete Time Keeping Record (Delete / Cancel)                                                                    |           |         |        |        |        |

### I4. Header: chuông thông báo, Devices, Global Search

| #    | Kiểm                                                                                                                                                                                                                                                                                        | Classic | Spring | Summer | Winter |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ------ | ------ |
| I4.1 | **Chuông**: popover Notifications, badge số / 99+, Mark all as read (disabled khi hết chưa đọc), pill Scheduled / Confirmed / Canceled / Done, tag #Requested / #Highlight / #No Show, 20 mục / trang, "No notifications yet" / "No more notifications", bấm mục → mở Appointment, Esc đóng |         |        |        |        |
| I4.2 | **Devices**: popover Terminal / Printer (Connected / Not Connected / Not Installed Driver), nút Check, badge "! N devices not connected"                                                                                                                                                    |         |        |        |        |
| I4.3 | **Global Search** (Ctrl+K): 4 tab có đếm, tối đa 20 dòng / loại, mở Customer Information / OH detail / Appointment                                                                                                                                                                          |         |        |        |        |
| I4.4 | **Scanner** = E11                                                                                                                                                                                                                                                                           |         |        |        |        |

### I5. Màn / tính năng bổ sung vào phần chung

| Mục                                                                                                                                     | Gộp vào |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Login QR, Staff Token (bấm Version 5 lần), Force Update + Retry, trang 404, banner offline / online, Device ID popover, Ctrl+K / Ctrl+B | C1      |
| Customer Information, Customer Group, Earn Points on Tip                                                                                | C6      |
| Check-in Kiosk / GoCheckin → Pending                                                                                                    | C7      |
| Turn quick-view tab (kéo được)                                                                                                          | C12     |
| Batch History + Batch Close Review; Font size Print All (VP-4809)                                                                       | C13     |
| Palette thợ / danh mục (VP-5338)                                                                                                        | B9      |

## J. Nguồn test case chạy ở mỗi theme

| Nguồn                                                                                   | Số lượng  | Cách chạy                                                                                                                                                                                                                                                                                                  | Classic | Spring | Summer | Winter |
| --------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ------ | ------ |
| Source code (`tests/**/*.spec.ts`, bulk lane)                                           | ~1.800 TC | `npm run test:bulk` với `APP_PATH` = bản cài, `REMOTE_DEBUG_PORT=9223`                                                                                                                                                                                                                                     |         |        |        |        |
| Linear VP catalog (`docs/qc/linear-pos-testcase-catalog.md`, mục A/B + E bổ sung 12/11) | ~200 dòng | Dòng đã có spec → theo kết quả bulk; dòng chưa có spec → test tay + soi UI                                                                                                                                                                                                                                 |         |        |        |        |
| Liên hệ thống: GAP (pos.gocheckin.net) → POS, GoCheckin kiosk → POS, Portal DEV ↔ POS   | 8 lane    | `test:web2pos`, `test:web2checkin`, `gap-appointment-board`, VP-5724 Portal↔POS, `portal:vp-4390 / 5338 / 5627 / 4809`; rồi xem tay: check-in mới hiện ở cột Check-in theme (Summer Checkin Today / Spring Pending pill / Winter WAITING LIST), lịch hẹn mới hiện ở Today Appt / APPT TODAY / Appointments |         |        |        |        |
| Checklist theme (mục B+, D, E, I)                                                       | —         | Test tay qua CDP + script soi UI (`audit.js`: chữ rộng 0, chữ bị cắt, tương phản thấp, tràn, cuộn ngang, nút nhỏ)                                                                                                                                                                                          |         |        |        |        |

## F. Ngoài phạm vi (ghi rõ trong báo cáo)

- Form tạo / sửa Appointment (app chưa có).
- Payment Gateway (đã gỡ khỏi sidebar).
- Portal (Device Management, Version Management…) — theme chỉ áp ở POS.
- Bước cần máy in / máy quét thật (receipt kiểm qua IPC payload).
- Mobile / offline (đã xoá theo yêu cầu 07/11).

## G. Bug đã có — không log trùng (đối chiếu Linear 12/11/2026)

Nguồn: project GoPOS Theme (8 bug), MAC USA POS Theme (3 bug), Zota POS Theme (5 bug), VP-7066, VP-6846, VP-6975 và VP-7139 (bug tổng hợp layout, 12 mục).

### Volt Spring (GoPOS)

| Bug              | Nội dung                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| VP-6860          | Quick Checkout: Skip · Walk-in che nút Done                                                         |
| VP-6861          | Dialog thanh toán (Gift Card, lỗi card, Scan QR): thanh tiêu đề tối trống, chữ / ảnh dính mép       |
| VP-6976          | Ô Customer Phone trên cùng disabled nhưng nhìn như dùng được                                        |
| VP-6978          | Checkout ở 2K: nội dung dồn lên trên, Complete Payment lơ lửng giữa cột                             |
| VP-7104          | Cash thiếu tiền: hiện Change $0.00, không có dòng Remaining                                         |
| VP-7140          | Re-Open › Change Staff: dialog thứ 2 "Change from X to ?" không đóng được                           |
| VP-7141          | Re-Open lần 2: thiếu thông báo "Items and prices are locked"                                        |
| VP-6973          | Setting › Themes: ảnh card theme quá nhỏ                                                            |
| VP-7139 #7       | Ticket: list pending bên trái mất dòng dịch vụ + chip trạng thái; panel phải trống tới khi chọn thợ |
| VP-7139 (chờ PO) | Chỉ hiện dịch vụ sau khi chọn thợ — design hay bug                                                  |

### Volt Summer (MAC USA)

| Bug              | Nội dung                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| VP-6839          | Order screen: Change Staff, sort thợ, icon Split Order gần như vô hình; tile Receipt không icon           |
| VP-6840          | Checkout: tóm tắt ticket cắt mã order + giờ; nút receipt màn Payment Successful dính mép                  |
| VP-6841          | OH detail: nhãn Re-Open chạm mép nút, Order ID bị cắt, icon Receipt mờ                                    |
| VP-7066          | Menu thẻ check-in quá hẹp                                                                                 |
| VP-7139 #1       | OH detail: list rộng hơn pane chi tiết, nút chen 2 hàng, Re-Open chạm mép ở 1920, Cancel Order không icon |
| VP-7139 #2       | Ticket: hàng chip danh mục thứ 4 bị cắt, chữ 12px, placeholder "Choose service" mờ                        |
| VP-7139 #3       | Appointment: cột thợ cuối bị cắt                                                                          |
| VP-7139 (chờ PO) | Appointment khác cấu trúc Classic (mini calendar bên phải, không Quick Checkout)                          |

### Volt Winter (Zota)

| Bug              | Nội dung                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| VP-6842          | Switch Settings mất nút gạt trên nền glass (Permissions, Accessibility, Receipt)           |
| VP-6843          | Report chart: nhãn trục khó đọc trên nền indigo                                            |
| VP-6844          | Time Tracking: icon empty bị header che, cột STAFF / NOTE lệch                             |
| VP-6845          | Checkout: tile Promo & Rewards giãn hết cột, thanh cuộn ngang lạ, badge bị cắt             |
| VP-6862          | Placeholder select khó đọc trên glass (Employee: Staff Group, Country)                     |
| VP-7139 #4       | OH detail: ADJUST TIP / RECEIPT không icon, chữ hoa / thường lẫn lộn, Re-Open tím trên tím |
| VP-7139 #5       | WAIT: avatar thợ ảnh vỡ                                                                    |
| VP-7139 #6       | APPT BOOK: cột thợ cuối bị cắt, không cuộn tới giờ hiện tại                                |
| VP-7139 (chờ PO) | Không có tab Order History / Appointment (OH chỉ qua menu ≡)                               |

### Mọi theme

| Bug         | Nội dung                                                                               |
| ----------- | -------------------------------------------------------------------------------------- |
| VP-6846     | Icon toast nhỏ, lệch tâm trong vòng tròn đôi                                           |
| VP-6975     | Card có thể lưu đơn thiếu tax (đơn $5.50, charge $6.00)                                |
| VP-7139 #8  | Setting › Themes: card chỉ dùng nửa trái màn 2K                                        |
| VP-7139 #9  | Popover lọc thợ (Pending, Appointment) hẹp ở 2K, chữ 12px                              |
| VP-7139 #10 | Nhãn giờ lịch hẹn quá nhỏ                                                              |
| VP-7139 #11 | Chip "Pending" trong Order History dính nhau                                           |
| VP-7139 #12 | Screen layout: tiệm chưa lưu layout → thiếu "Pending orders", Save làm mất cột Pending |

**VP-7187 (bug batch GoPOS Theme, 12/11):** gom VP-6860, 6861, 6976, 6978, 7104, 7140, 7141, 7139 làm sub-issue; VP-6973 đã fix (#3435 — 12/11 thấy card schematic, kiểm lại). Quy tắc của batch: Classic không đổi; layout thiết kế cho **2560×1440, scale 100%** (lỗi chỉ có ở 1920 ghi rõ độ phân giải); tiền / luồng order dùng lại logic Classic.
→ Bug mới ở Spring: log thành **sub-issue của VP-7187**, project GoPOS Theme, `[POS] [Volt Spring] …`, assign khanh_do.

**Quy tắc:** gặp lỗi trùng → chỉ kiểm lại + comment vào bug cũ (version + ảnh), không tạo mới. Cùng màn nhưng khác bản chất (hỏng tính năng, không chỉ UI) → log mới.

**Vùng ưu tiên tìm bug mới** (VP-7139 ghi chưa kiểm): màn checkout, đổi thợ trên ticket, menu ≡ ở Classic / Spring / Summer.

## H. Log bug mới

Skill `create-bug`: team VOLT, Todo, label Bug, project GoPOS / MAC USA / Zota, tiêu đề `[POS] [Volt <Theme>] …`. Ghi bước, kỳ vọng, thực tế, so với Classic, kèm ảnh theme + ảnh Classic. Kiểm trùng trước khi tạo.
