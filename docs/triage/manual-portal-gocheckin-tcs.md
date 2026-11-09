# TC kiểm tay cần Portal / GoBooking / GoCheckin (331 TC)

## app-rpt-set-perm-devm › Portal > Device Management (61)

- Danh sách chỉ gồm POS của đúng merchant đang chọn, mỗi POS đủ thông tin cơ bản (nguồn VP-1198 TC-01) (DEVM-001) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Mỗi POS có các action theo spec: Remote View, Disconnect, View Detail (nguồn VP-1198 TC-01) (DEVM-002) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Đổi merchant thì list thay toàn bộ, không còn POS của merchant trước (DEVM-003) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Merchant chưa có POS nào → empty state, không lỗi, không banner offline (DEVM-004) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Tất cả POS Online → không có banner, không dòng nào highlight (DEVM-006) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Thanh toán 1 đơn trên POS test → Last payment của đúng POS đó cập nhật (DEVM-007) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- POS chưa có giao dịch nào → Last payment để trống / — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Sau khi POS cập nhật phiên bản mới, App version trên Portal đổi theo (DEVM-009) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Thiết bị Pending/Inactive (Device Pending) hiển thị thế nào ở trang Device của merchant (DEVM-010) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- POS mở app nhưng không thao tác vẫn Online (heartbeat 5 phút thay cho đo lưu lượng sync) (DEVM-012) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trạng thái POS/Terminal/Printer trên Portal khớp trạng thái thực sau chu kỳ cập nhật; không yêu cầu realtime (nguồn VP-1198 TC-04) (DEVM-015) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trigger — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trigger — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trigger — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trigger — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trigger — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Timestamp hiển thị theo timezone merchant, định dạng thống nhất giữa List và Detail (DEVM-026) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Hiển thị SN + Active / Inactive của Terminal và Ready / Not connected của Printer, khớp header POS (nguồn VP-1198 TC-03) (DEVM-027) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Một POS gắn nhiều terminal theo thời gian: rút A cắm B → A Inactive (có Last disconnected), B Active; list hiển thị cả 2 (nguồn VP-1198 TC-0 (DEVM-028) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Rút máy in → POS header Not Connected trong ~5 s, Portal Printer Not connected; cắm lại → Ready (DEVM-029) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Rút terminal → Portal Inactive + Last disconnected; cắm lại → Active + Last connected (DEVM-030) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- POS chưa từng gắn terminal/printer → Portal không hiện dòng terminal/printer rỗng hay lỗi (DEVM-032) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Máy in cắm nhưng thiếu driver (Not Installed Driver trên POS) → ghi nhận trạng thái trên Portal (DEVM-033) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- View Detail mở đúng device và hiển thị Device ID, Last connected/disconnected, Uptime (7 days), Current status (nguồn VP-1198 TC-07) (DEVM-034) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Connection History 7 ngày: mỗi ngày có Date, Uptime %, Status (nguồn VP-1198 TC-08) (DEVM-035) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Uptime % theo ngày và Uptime 7 ngày tính đúng theo thời gian Online (DEVM-036) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Terminal List: mỗi terminal có SN, Status, Last connected, Last disconnected; không có action remote ở cấp Terminal (nguồn VP-1198 TC-09) (DEVM-039) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Quay lại từ Detail về List giữ merchant đang chọn và vị trí/bộ lọc (DEVM-040) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Mở URL Detail với Device ID không tồn tại hoặc thuộc merchant user không có quyền → báo không tìm thấy / không có quyền, không lộ dữ liệu (DEVM-041) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Remote View POS Online vào ngay, không hỏi credential (dùng credential lưu trên device), audit log ghi Remote View – success (nguồn VP-1198 (DEVM-042) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Phía POS trong phiên Remote View: app không bị gián đoạn, order đang mở giữ nguyên, Customer Display không đổi (DEVM-043) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Credential lưu trên device sai → báo lỗi credential, audit log fail với reason tương ứng (nguồn VP-1198 TC-12.1) (DEVM-045) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Kết nối remote quá thời gian → báo timeout, audit log fail reason timeout (nguồn VP-1198 TC-12.2) (DEVM-046) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Dịch vụ remote không sẵn sàng → báo remote service unavailable, audit log fail reason tương ứng (nguồn VP-1198 TC-12.3) (DEVM-047) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Đang có phiên remote vào POS, user thứ 2 Remote View cùng POS → báo session conflict, phiên đầu không bị cắt (nguồn VP-1198 TC-12.4) (DEVM-048) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Trong phiên remote, action nhạy cảm (thanh toán, refund) không bị chặn ở tầng remote nhưng vẫn hỏi passcode riêng của app (nguồn VP-1198 TC- (DEVM-049) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Sau Disconnect: POS về /login, màn khách reset, heartbeat dừng; đăng nhập lại bằng QR thì Online lại, thiết bị vẫn Active (không phải Pendin (DEVM-052) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Disconnect khi POS còn order Pending và dữ liệu chưa đẩy lên → sau khi đăng nhập lại không mất order/giao dịch (DEVM-054) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Huỷ ở bước xác nhận Disconnect → không có gì thay đổi, không ghi audit log (DEVM-055) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Disconnect chỉ kết thúc phiên, không đổi trạng thái thiết bị: khác Deactivate (APP-020) vốn chặn lần đăng nhập sau (DEVM-057) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Gửi APP_UPLOAD_LOG cho máy test → POS tự nén và tải log lên trong ≤ 1 phút, kết quả uploaded; POS không hiện gì, không gián đoạn (DEVM-058) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Lệnh upload log tới POS sau khi grant hết hạn → kết quả failed — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Validate tham số: expires_in 60–3600, older_than_days 1–365 (VP-3312) (DEVM-060) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- APP_TRASH_LOG chuyển log cũ hơn mốc vào thư mục trash/ (không xoá), log đang ghi không bị chuyển; lần upload sau không kèm trash/ (DEVM-061) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Lệnh chỉ chạy trong 20 phút kể từ khi tạo: POS online lại trong 20 phút thì chạy; quá 20 phút thì từ chối với lý do rõ ràng (DEVM-062) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Lệnh gửi cho POS A không chạy trên POS B cùng merchant và B không ghi đè kết quả của A (DEVM-063) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- PING trả về pong; lệnh mà bản app không hỗ trợ bị từ chối có nêu phiên bản (DEVM-064) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Lệnh support chạy ngầm khi thu ngân đang ở màn thanh toán không làm treo/chậm rõ rệt hay đổi màn hình (DEVM-065) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- User KHÔNG có quyền remote/credential không xem được credential và không Remote được (nguồn VP-1198 TC-15) (DEVM-066) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- User có quyền dùng được credential và Remote; credential lấy đúng từ POS tương ứng (nguồn VP-1198 TC-16) (DEVM-067) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- User chỉ có quyền view device data (VP-1198) xem được List/Detail/History nhưng không có action Remote View/Disconnect (DEVM-068) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- User không có quyền xem thiết bị → không thấy menu Device; mở URL trực tiếp bị chặn (DEVM-069) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- User chỉ được gán merchant A không xem/thao tác được thiết bị của merchant B (kể cả qua URL/API) (DEVM-070) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Cập nhật credential remote → được lưu, ghi audit log Credential update; Remote View sau đó dùng credential mới (DEVM-071) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Cập nhật credential bỏ trống/sai định dạng/user không có quyền → bị chặn, credential cũ giữ nguyên (DEVM-072) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Mỗi action từ trang tạo 1 bản ghi đủ trường: Device ID, Terminal SN (nếu có), Action type, User, Result success/fail, Timestamp, Failure rea (DEVM-073) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Device History ghi sự kiện hệ thống (VP-1198): device connected/disconnected, đổi trạng thái POS/terminal, có Device ID, Terminal SN, Event (DEVM-074) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Filter theo Device ID, Terminal SN, Action type, User, Result/status, Time range và tổ hợp trả về đúng bản ghi (nguồn VP-1198 TC-18) (DEVM-075) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Filter không có kết quả → empty state; Time range ngược (từ > đến) bị chặn hoặc báo lỗi (DEVM-076) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Audit log chỉ đọc: không sửa/xoá được; bản ghi cũ vẫn còn (chưa giới hạn retention) (DEVM-077) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_
- Thứ tự sắp xếp, phân trang và timezone của Audit Log nhất quán (DEVM-078) — _DEVM is a fastboy-portal page (device list / detail / history / remote view / disconnect / support commands / audit log); the POS lane canno_

## app-rpt-set-perm-devm › Compensation / payroll configuration (56)

- Discount Charge hiển thị và được cộng vào Total Earnings (RPT-081) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Discount Charge chỉ tính trên dòng dịch vụ có staff (RPT-082) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Đổi Discount Setting → Discount Charge theo tỉ lệ mới, không $0.00 (RPT-083) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Refund đơn có giảm giá ghi Discount Reversed (RPT-084) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Card Charge Tip hiển thị giá trị thật, các dòng cộng ra Total Income (RPT-103) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Phí thẻ chỉ trừ cho staff compensation = commission (RPT-104) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Commission tính trên giá trước thuế (RPT-105) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Service fee không vào doanh thu/commission của staff (RPT-106) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Supply Share Method: Before = $51.00, After = $47.00 (RPT-107) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Deduct After Commission khi supply lớn hơn commission (RPT-108) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Discount Charge phân bổ theo tỉ lệ dịch vụ (RPT-109) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Custom promotion dùng tỉ lệ của đơn (RPT-110) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff chỉ nhận lương (salary) không bị trừ Discount Charge (RPT-111) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Làm tròn phân bổ promotion 3 staff (RPT-112) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Hiển thị commission sản phẩm khi có cấu hình (RPT-113) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Khoảng ngày qua nhiều kỳ hiện tỉ lệ theo từng kỳ (RPT-114) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary view: Wage Per Day (RPT-115) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary view: Wage Per Hour, giờ làm 2 chữ số thập phân (RPT-116) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Clock In/Out chỉ hiện khi xem 1 ngày (RPT-117) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Rate của salary là số tiền, không phải % (RPT-118) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary by Period: lương cố định của kỳ (RPT-119) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff commission_salary hiển thị Salary view (RPT-120) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Nhiều mức lương trong khoảng → Rate — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Credit Card Tips Added to Check = ON (RPT-124) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff đặt 100% Pay 2 không có thu nhập ở Pay 1 (RPT-125) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Khấu trừ chỉ trừ vào Pay 1 (merchant cấu hình Pay 1 = cash − deduction) (RPT-126) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Đơn được nhóm theo ngày hoàn tất, refund theo ngày refund (RPT-132) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Kỳ lương khớp loại pay period (weekly/bi-weekly/half-month) (RPT-137) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Current Period liệt kê cả staff Total Income $0 (RPT-140) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Kỳ khoá liệt kê mọi staff active kể cả $0 (RPT-141) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary view của payroll (RPT-146) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff không có số liệu → — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff commission 0% có đơn: Subtotal không bị về $0.00 (RPT-148) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Dấu Refund khác nhau giữa kỳ khoá và kỳ mở (RPT-149) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Commission + Salary kỳ mở hiển thị phần lớn hơn, hoà → Salary (RPT-152) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Count Days Off OFF → trả MAX(Salary, Commission) (RPT-153) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Vi phạm ngày nghỉ → chỉ trả Salary (RPT-154) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary by Period không áp dụng giới hạn ngày nghỉ (RPT-155) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Đổi compensation giữa kỳ → tính lại toàn bộ kỳ hiện tại (RPT-156) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Kỳ đã in check không recalculate được, POS giữ nguyên (RPT-158) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Kỳ khoá giữ snapshot khi setting đổi (RPT-159) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Dữ liệu payroll đồng bộ trễ (RPT-160) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Wage Per Day: ngày có ≥ 1 check-in tính đúng 1 ngày công; ngày không check-in = 0; nhiều ca vẫn 1 ngày; thiếu check-out (auto check-out) vẫn (RPT-194) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary view Wage Per Day: Salary Amount = Rate × Working Days; Clean Up Fee/Deduction = Deduction Per Day × Working Days (nguồn VP-1148 TC-7 (RPT-195) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Salary by Period: Salary Amount = mức cố định của kỳ, không nhân số ngày; Clean Up = Deduction × Working Days (nguồn VP-1341 TC-6) (RPT-196) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Wage Per Hour: Salary Amount = Rate × Working Hours; Clean Up tính theo Working Days (nguồn VP-1341 TC-8) (RPT-197) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Staff Salary: Pay 1 = round(Total Income × Pay 1%), Pay 2 = Total Income − Pay 1; Clean Up và Tip đã nằm trong Total Income (nguồn VP-1148 T (RPT-198) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Bật Exclude Tips From Cash/Check Income: tip vẫn hiển thị nhưng không cộng vào phần chi trả Pay 1 (cash) / Pay 2 (check) (nguồn VP-1341 TC-3 (RPT-200) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Đơn nhiều thợ chia tip: mỗi staff áp setting Exclude Tips của riêng mình, không lẫn nhau (nguồn VP-1341 TC-5) (RPT-201) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Count Days Off chỉ tác động staff Commission + Salary; staff Commission và staff Salary nghỉ nhiều vẫn tính như thường (nguồn VP-1343 TC-1) (RPT-202) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Khi vi phạm ngày nghỉ luôn trả Salary only (1 quyết định duy nhất), Salary = Wage Per Day × Working Days, không fallback sang Commission (ng (RPT-203) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Vi phạm ngày nghỉ được xét độc lập theo từng kỳ lương (nguồn VP-1343 TC-17) (RPT-204) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Đổi Max days off rồi Recalculate kỳ chưa in check → kết quả theo setting mới (nguồn VP-1343 TC-18) (RPT-205) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Ngày nghỉ có phép (Approved Leave) có bị tính là Day Off không (nguồn VP-1343 TC-19) (RPT-206) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Hiển thị khi vi phạm: kỳ khoá chỉ hiện Salary view, không có nhãn lý do; kỳ đang mở vẫn ước tính theo phần lớn hơn (nguồn VP-1343 TC-15, TC- (RPT-207) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_
- Lưu cấu hình Salary – Wage Per Day, Pay 1, Deduction, Exclude Tips; giữ nguyên khi mở lại; staff khác không đổi (nguồn VP-1148 TC-2, VP-1341 (SET-183) — _Needs staff with a specific compensation (Salary by Period / Wage per Day / per Hour, Commission + Salary, Pay 1-Pay 2, days-off limits, sup_

## home-pend › GoCheckin kiosk (24)

- A check-in order card carries the full check-in information (PEND-024) — _GoCheckin kiosk (separate web surface, volt-qc `gci` fixture) creates the check-in order._
- Completing a check-in order keeps the Checkin Today count and marks it Completed (PEND-044) — _GoCheckin check-in, then pay it._
- A returning customer with full details checks in → exactly 1 pending order, Checkin Today +1 (PEND-045) — _GoCheckin kiosk._
- Customer missing email / birthday skips those steps and still makes exactly 1 order (PEND-046) — _GoCheckin kiosk._
- A customer who never signed consent signs first, then the order is created (PEND-047) — _GoCheckin kiosk (consent signature)._
- A new number: name, consent, new customer and exactly 1 pending order (PEND-048) — _GoCheckin kiosk._
- The GoCheckin new-customer name refuses digits (PEND-049) — _GoCheckin kiosk name field._
- A number already checked in and not checked out is blocked; no new order (PEND-050) — _GoCheckin kiosk._
- Abandoning at the signature page then checking in again leaves exactly 1 order (PEND-051) — _GoCheckin kiosk._
- Abandoning midway without redoing creates no order (PEND-052) — _GoCheckin kiosk._
- Checking in 5 existing + 3 new numbers creates exactly 8 orders (PEND-053) — _GoCheckin kiosk, 8 check-ins._
- Every check-in reaches the POS; none dropped at random (PEND-054) — _GoCheckin kiosk, repeated check-ins._
- A check-in order reaches the POS within seconds (PEND-055) — _GoCheckin kiosk timing._
- A checked-in customer appears in Pending Orders, not only in Checkin Today (PEND-056) — _GoCheckin kiosk._
- Checkout shows the checked-in customer — _GoCheckin kiosk._
- Searching a checked-in customer by phone on Home opens their check-in order, no second order (PEND-058) — _GoCheckin kiosk._
- The Link / Create Separately prompt for a pending order with the same phone (PEND-059) — _GoCheckin kiosk + same phone on Home._
- Two pending orders of one customer: completing one leaves the other untouched (PEND-060) — _GoCheckin kiosk + two orders of one customer._
- A checked-in customer paid through another order links the check-in, no sync error (PEND-061) — _GoCheckin kiosk._
- Checking out one checked-in customer does not drop the other check-ins (PEND-062) — _GoCheckin kiosk, several check-ins._
- A check-in shown in Pending stays on the order into checkout (PEND-063) — _GoCheckin kiosk._
- A paid check-in order keeps its customer in Order History (PEND-064) — _GoCheckin kiosk._
- A check-in order opens empty, with the customer, waiting for staff / service (PEND-065) — _GoCheckin kiosk._
- A QR (GBK ticket) check-in on GoCheckin reaches the POS (PEND-066) — _GoCheckin QR ticket (GBK) needs the kiosk camera / scanner._

## app-rpt-set-perm-devm › Sign-in (QR / Staff Token / OTP / sign-out) (22)

- Bố cục màn Login QR (APP-024) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- QR hết hạn sau 50 giây và tạo được mã mới (APP-025) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Owner quét QR bằng GCI Business app thì đăng nhập thành công (APP-026) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Quét bằng tài khoản không phải Owner thì bị từ chối (APP-027) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Business chưa kích hoạt gói Volt POS thì bị từ chối (APP-028) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Thiết bị đã gắn merchant A thì quét QR merchant B bị chặn (Order Flow 1.4) (APP-030) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Tap ẩn 5 lần vào — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Kiểm tra i18n màn Login khi ngôn ngữ Tiếng Việt (APP-032) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Bố cục màn đăng nhập bằng Staff Token (APP-033) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Validate trường bắt buộc (APP-034) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Token sai hoặc hết hạn bị từ chối (APP-035) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Token không gắn merchant nào bị từ chối (APP-036) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Token hợp lệ đăng nhập thành công (APP-038) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Nút quay lại màn QR hoạt động (APP-039) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Paste token có khoảng trắng đầu/cuối (APP-040) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Thiết bị Active đăng nhập bằng OTP còn hạn (5 phút) (APP-041) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- OTP chỉ dùng được một lần (APP-042) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- OTP quá 5 phút thì hết hạn (APP-043) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- OTP tạo cho thiết bị A không dùng được trên thiết bị B (APP-044) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Tạo OTP mới thì OTP cũ mất hiệu lực (APP-045) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Thiết bị chưa Active không đăng nhập được bằng OTP (APP-046) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _
- Phiên bị vô hiệu (sự kiện tokenCleared) thì màn chính về Login và màn khách reset (APP-050) — _Signs the device out or in: real QR login needs the GCI Business app on a phone, Staff Token / OTP need tokens issued from Portal, and each _

## app-rpt-set-perm-devm › Portal / Business App (21)

- Portal hiển thị thiết bị Online với version đúng (healthz mỗi 5 phút, coi là online nếu thấy trong 10 phút) (APP-051) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Đổi giá dịch vụ trên Portal thì POS nhận sau lần pull, không cần restart (APP-086) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Tạo/sửa staff trên Portal xuất hiện ở các danh sách staff của POS (APP-087) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Bật/tắt Status hoặc Appointment Staff trên Portal không làm mất role của staff trên POS (APP-088) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Staff bị xoá biến mất khỏi POS và passcode của họ không còn dùng được (APP-089) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Đổi Passcode Settings trên Portal thì POS áp dụng theo (APP-090) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Để app idle khi Portal liên tục thay đổi dữ liệu thì sync vẫn chạy, không có lỗi — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Danh sách staff active trên POS bằng đúng danh sách trên Portal (APP-094) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Tạo staff với Email rỗng không sinh ra staff trùng trên POS (APP-095) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Show Point/Reward đồng bộ 2 chiều POS ⇄ Portal (SET-042) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Discount Setting đồng bộ 2 chiều POS ⇄ Portal (SET-059) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Email có khoảng trắng đầu không làm kẹt hàng đợi sync (SET-177) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Portal bật/tắt Status hoặc Appointment Staff không xoá Role của staff trên POS (SET-178) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Passcode Setting đồng bộ 2 chiều POS ⇄ Portal và sang máy POS khác (PERM-035) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Đổi quyền role trên Portal đồng bộ xuống POS và áp vào passcode (PERM-085) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Quyền bổ sung thêm/gỡ trên Portal đồng bộ xuống POS (Doc Portal Access Control) (PERM-086) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Toggle Status trên Portal không làm staff mất role/permission trên POS (PERM-088) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Mỗi staff có 1 mã duy nhất dùng chung cho passcode POS, check-in/out và đăng nhập Business App (PERM-090) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Recalculate Payroll trên Portal phản ánh trên POS (RPT-157) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Dữ liệu batch từ FastboyPay hiển thị trên POS (RPT-171) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._
- Total Income POS = Business App/Portal (RPT-178) — _Asserts on, or is driven from, fastboy-portal / GoCheckin Business App: another surface this POS lane cannot drive or observe._

## pay › Portal / store configuration (21)

- Ticket example: Service $75, SF 2.5%, Tip $15 ⇒ $91.88 (PAY-067) — _Portal: needs a fixed SF 2.5% fixture._
- Standard example: items $100, SF 4%, CD 4% ⇒ Card $104.00, Cash/Other/Gift Card $100.00 (PAY-082) — _Portal: needs SF 4% + CD 4%._
- SF on net, tax on net + SF: $100, SF 5%, tax 10% ⇒ Card $115.50, Cash $110.00 (PAY-083) — _Portal: needs SF 5% + tax 10%._
- 2 × $100 by Card, SF 5%, tax 10% ⇒ Subtotal $210, Tax $21, Total $231 (PAY-084) — _Portal: needs SF 5% + tax 10%._
- SF/CD rounding over several odd-cent items lands on whole cents for Card and Cash (PAY-085) — _Portal: needs a fixed SF/CD and odd-cent catalogue items._
- Service Fee doc example: S1 $5 (−10%), S2 $17 (−50%), SF 10% ⇒ fee $1.30 (PAY-087)  — _Portal: needs SF 10% and the $5 / $17 fixture services._
- A 100%-discounted item adds nothing to the fee base (PAY-088) — _Portal: needs a fixed SF to read the fee base of a 100%-off line._
- Ticket example: Service $100 + Gift Card $50, SF 5% ⇒ SF $5.00 (PAY-091) — _Portal: needs SF 5% fixture._
- With Apply Service Fee to Gift Card ON, gift card sales carry SF/CD (PAY-093) — _Portal toggle "Apply Service Fee to Gift Card" = ON._
- Re-open a Cash order, add a service, pay Cash: no SF, correct tax (PAY-094) — _Re-open Edit Order is locked on build 1.1.56 + needs a fee config._
- Re-open Cash (2×$100) + $100, switch to Card ⇒ Enter Amount $115.50 (PAY-095) — _Re-open Edit Order is locked on build 1.1.56 + needs SF 5% / tax 10%._
- Product Tax applies to products, Supply Sale included (PAY-097) — _Portal: Product Tax + a "Supply Sale" product._
- Service Tax + Product Tax merge into one Tax row on checkout and customer display (PAY-098) — _Portal: Service Tax + Product Tax both set._
- Per-line tax allocation never goes negative: 6 × $0.15 at 10% ⇒ Cash $0.99 (PAY-099) — _Portal: tax 10% + six $0.15 catalogue lines._
- Variant price sets still produce correct, non-negative tax (PAY-100) — _Portal: variant price sets._
- 1-cent fixture: SF 4%, CD 3.5%, tax 8.25%, product $19.00 by Cash ⇒ Tax $1.58 / Total $20.67 (PAY-101)  — _Portal: SF 4%, CD 3.5%, tax 8.25% + a $19.00 product._
- Tax still applies after sign-out / sign-in and after sync (PAY-102) — _Sign-out / sign-in is a QR login on this device._
- A method left out of Tip Settings gets tip 0 and a disabled Tip button (PAY-063) — _Tip Settings (store-wide, synced from Portal) must exclude a method._
- Removing every staff from a tipped order warns — _Needs a Store-only line beside the staff block + Remove Staff; the Remove Staff flow has no reliable hooks on 1.1.x._
- Tip type Amount shows fixed-amount presets and no — _Tip Settings type Amount (store-wide)._
- A method not allowed to tip does not push the tip screen and completes at once (PAY-079) — _Tip Settings must exclude the method (store-wide)._

## appt-time-turn › (no section) (20)

- Board lists every appointment of the day like the GBK dashboard, Unassigned included (APPT-021) — _Needs the GoCheckin (GBK) dashboard to compare against._
- Online booking lands in the chosen staff column, never in a blocked area (APPT-022) — _Needs a new booking placed on the online booking site for a chosen staff._
- Customer name matches GBK, never — _Needs customer names compared with the GBK dashboard._
- Walk-in booking without customer shows the booker name (APPT-050) — _Needs a guest booking (booker name, no customer) from GBK / DTS._
- Highlight, Requested and No Show tags are displayed (APPT-054) — _Highlight / Requested / No Show tags are only set in GoBooking._
- Header badge updates by itself when a new appointment syncs in (APPT-078) — _Needs a new online booking to sync in._
- Booking without services creates an order with customer and staff, no items (APPT-089) — _Needs an online booking with a staff and no service._
- Inactive booking staff warns and asks for another staff (APPT-093) — _Needs the booking staff deactivated in Portal._
- After payment the booking becomes Done and loses Checkout (APPT-097) — _Paying turns a real booking Done for good; needs a seeded online booking._
- Order from an appointment keeps the customer and earns points (APPT-099) — _Needs a customer-linked online booking, a payment and a points check._
- Past appointment checked out today gets the completion date as order date (APPT-100) — _Needs a past unpaid online booking (overnight) plus payment._
- Clicking a new-appointment notification moves the board to it and opens the popover (APPT-106) — _Needs a new-booking notification from the online booking site._
- New online booking appears on POS without reload (APPT-109) — _Online booking site._
- Appointment canceled in GoBooking disappears from the board (APPT-110) — _Needs a cancellation done in GoBooking._
- Changing staff work hours on Portal updates the hatched area (APPT-111) — _Needs a Work Hours change on Portal._
- Dialog lists Active staff only; both columns add up to the Active staff count (TIME-006) — _The expected total is the Active staff count on Portal._
- Staff switched to Inactive disappears, even while IN (TIME-007) — _Needs a staff set Inactive on Portal and a sync wait._
- Hourly wage is computed from the sum of Total Hours (TIME-091) — _Payroll formula cases: need staff compensation, day-off rules and a payroll period set up in Settings / Portal._
- Record created on POS shows on Portal at the right time in the merchant timezone (TIME-099) — _Needs Portal Timekeeping._
- Record edited on Portal is updated on POS (TIME-100) — _Needs a record edited on Portal._

## promo-split › Portal: rewards / discount charge (15)

- Custom $15 + fixed $15 reward on $20 is capped at $20 (VP-4375) (PROMO-035) — _Portal reward + a customer with enough points._
- Checkout groups item / promotion / reward under — _Needs item discount + promotion + reward on one order (Portal reward)._
- Discount Charge counts service lines only, not products (VP-3436) (PROMO-057) — _Portal: a retail product (Store line) in the catalogue._
- A new Discount Setting applies to new orders only (VP-3596) (PROMO-059) — _Portal promotion + changing the store Discount Setting._
- A reward charges nothing to the staff (PROMO-060) — _Portal reward._
- A customer with enough points sees the reward (VP-4335) (PROMO-062) — _Portal reward + customer with ≥ 500 points._
- A customer without enough points does not see the reward (PROMO-063) — _Portal reward + customer below the threshold._
- Apply a fixed $10 reward (PROMO-064) — _Portal reward._
- Completing a reward order deducts its points and earns on the amount paid (PROMO-065) — _Portal reward + points ledger._
- A promotion and a reward together (PROMO-066) — _Portal promotion + reward._
- Untick a reward → Apply removes it (PROMO-067) — _Portal reward._
- A reward created at $0 then edited to $50 discounts $50 (VP-3974) (PROMO-068) — _Portal/DTS: edit a reward value and wait for sync._
- Changing a reward $10 OFF → 10% OFF on Portal is picked up by POS (VP-3302) (PROMO-069) — _Portal: change the reward type and wait for sync._
- GoCheckin points (incl. imported customers) sync to POS and unlock rewards (VP-3038) (PROMO-070) — _GoCheckin: an imported customer with points._
- Refunding a reward order does not return the reward points (PROMO-071) — _Refund of a SETTLED reward order (overnight settle + Portal reward)._

## cd-e2e › (no section) (11)

- Show Point / Show Reward saved on POS match Portal and Portal edits sync back (CD-038) — _Needs Portal › Settings › Configuration › Customer Display to compare / edit (the POS leave-guard half is automated in cd-settings CD-037)._
- One GoCheckin check-in creates exactly one pending order on POS within seconds (E2E-006) — _Needs the GoCheckin kiosk (gap.gocheckin.net) check-in — the cross-surface web lane, not the app lane._
- Finish the E2E-006 check-in order by Other and book the right points (E2E-008) — _Depends on the E2E-006 GoCheckin order._
- Returning customer: GoCheckin → pending → staff/services → Cash → points → reports (E2E-011) — _Needs a GoCheckin check-in of an existing customer._
- Returning customer via GoCheckin paid by a named Other tender: Other points, — _Needs a GoCheckin check-in (volt-qc E2E-T03 drives the kiosk with its `gci` fixture)._
- New customer first check-in → Other → created on POS/Portal with points and 1 visit (E2E-013) — _Needs a first-time GoCheckin check-in and Portal to read the created customer._
- Three check-ins: paying #1 never hides / renames orders #2, #3 (E2E-014) — _Needs three GoCheckin check-ins._
- Quick Checkout with the phone of a checked-in customer → — _Needs a pending GoCheckin order for the phone typed on Quick Checkout._
- Checkout a Confirmed appointment → pre-filled order → paid → appointment Done with the order code (E2E-042) — _Needs a Confirmed appointment booked beforehand on Portal / GoCheckin (see npm run test:web2pos)._
- Portal ↔ POS sync of Discount Setting, customer note, Reward value, Passcode Setting (E2E-054) — _Needs Portal edits (Discount Setting, customer note, Reward value, Passcode Setting) and sync both ways._
- Wrong-store guard: not store 20258 — _Production safety guard: wrong store on Volt POS / GoCheckin must stop the whole run._

## oh-reopen › Portal web (11)

- A GoCheckin check-in order keeps its customer in Order History after payment (OH-083) — _GoCheckin web check-in (cross-surface web lane) creates the order._
- Voiding an order in Portal shows Canceled on POS after sync (OH-127)
- A refund done in Portal shows the same status and txns on POS (OH-153)
- Support switching Cash → Other in Portal is reflected in POS Order History (OH-181)
- Portal: Edit Order disabled for Re-opened, Pending, Canceled orders (RO-071)
- Portal locks Edit Order while Re-open and unlocks after Re-Open Done (RO-133)
- Reopen + $100 service on SF 5% / tax 10% → Card $115.50 / Cash $110.00 / Other $110.00 (OH-168) — _Merchant rates / toggles are Portal config (fixed SF 5% / tax 10%, gift-card SF toggle, CD%)._
- Reopen + $62 paid Cash without SF → tax $6.20 → $68.20; Card 2×$100 split (OH-169)
- Recompute follows the gift-card SF toggle saved at sale, not the current setting (RO-070)
- Changing the merchant CD% after the sale: the Cash difference still uses the order
- An order in a closed income-staff period cannot be re-opened (RO-111) — _Payroll / income-staff period must be closed in Portal first._

## promo-split › (no section) (11)

- Apply a preset % promotion to every service (PROMO-007) — _Portal: an Active 10% promotion for the customer's group._
- A fixed $ preset promotion takes off exactly its amount (PROMO-008)  — _Portal: an Active $5 promotion._
- One promotion per order: picking a 2nd unselects the 1st (PROMO-009) — _Portal: ≥ 2 Active promotions for the test customer._
- Custom Discount and a preset promotion are mutually exclusive (PROMO-010) — _Portal: preset promotions._
- Switch the applied promotion before payment (PROMO-011) — _Portal: two preset promotions._
- Remove an applied promotion: untick → Apply (PROMO-012) — _Portal: a preset promotion to remove._
- Expired or Inactive promotions do not show on POS (PROMO-013) — _Portal: an expired / Inactive promotion._
- A group-targeted promotion shows only for customers of that group (PROMO-014) — _Portal: a promotion targeted at a customer group + customers in / out of it._
- A one-time-use promotion does not reappear for the same customer (PROMO-015) — _Portal: a one-time-use promotion already used by the customer._
- A preset promotion shows the store Owner/Staff split, locked (VP-3533) (PROMO-016) — _Portal promotion + Discount Setting 40/60 (store-wide setting shared with other lanes)._
- After a 40/60 preset, switching to Custom Discount resets the split to 100/0 (VP-3533) (PROMO-017) — _Portal promotion + Discount Setting 40/60._

## home-pend › Portal data / settings (8)

- A staff created on Portal / GAP shows on the POS after sync (HOME-018) — _Needs a staff added / edited on Portal or GAP, then a sync._
- Sort — _Needs Turn Count data: clock-ins and finished turns for several staff today._
- Sort — _Needs several staff with appointments booked later today._
- Turn ON: staff cards show the turn count and Available (green) / Busy (orange) (HOME-029) — _Turn on/off is a merchant-global Portal setting (and the turn board is shared by every lane)._
- Turn OFF: staff cards show no turn / Busy / Available (HOME-030) — _Turn on/off is a merchant-global Portal setting._
- An Inactive service is not offered on Home (HOME-045) — _Needs a service set Inactive on Portal (and its name)._
- Services in a category follow the order the merchant set on Portal (HOME-046) — _Needs the service order arranged on Portal to compare with._
- A staff made Inactive while in an order raises — _Needs a staff set Inactive on Portal while sitting in an open order._

## home-pend › GoCheckin / appointments (8)

- Picking a customer with a pending check-in order opens that order instead of a new one (HOME-115) — _Needs a GoCheckin check-in for the customer (kiosk on another surface)._
- Production has no — _Production-only observation (VP-3314 dialog absent on prod) — the suite never runs writes on prod._
- Checking out an appointment while an order is open asks first; Cancel keeps the current order (HOME-118) — _Needs a booked appointment for today checked out from the board (appointment data owned by the 08 lane)._
- Clicking an appointment result in Search opens today — _Needs an appointment result in header Search (booked for today)._
- The bell shows a badge and opens the notification popover (HOME-164) — _Notifications come from booking-site appointment events._
- No notifications → empty state (HOME-165) — _Needs a merchant with no notifications at all (shared till always has some)._
- — _Needs unread notifications generated by the booking site._
- Notification text follows the appointment status (HOME-167) — _Needs appointments in each status to produce each notification text._

## promo-split › Gift card: hardware / network / restart / Portal (8)

- Scanning a card code on Sell Gift Card fills it, repeatedly (VP-2935) (PROMO-132) — _Barcode scanner / camera + a QR gift card._
- A failed redeem rolls its transaction back (VP-3565) (PROMO-149) — _Network cut exactly while pressing Pay._
- The receipt prints the gift-card balance line, $0.00 included (VP-4176) (PROMO-152) — _Receipt printer._
- After an app restart the unpaid gift-card line is still editable and tops the card up (PROMO-178) — _App restart with an unpaid gift-card line._
- Refunding a settled gift-card sale (Cash): is the card balance reversed? (PROMO-183) — _Refund of a gift-card sale SETTLED on a previous day (overnight settle)._
- Card code, status, balance and history on Portal match POS (PROMO-186) — _Portal Gift Card Management web._
- Gift-card data stored on the device is not plain text (VP-1261) (PROMO-191) — _Needs the app data folder inspected with dev help (encryption at rest)._
- A flaky network during sync neither loses nor doubles a top-up (VP-1261) (PROMO-192) — _Flaky network during sync._

## home-pend › Second POS / Portal (6)

- An order created elsewhere appears on /order-pending within seconds, no reload (PEND-023) — _Needs a second POS (or GoCheckin) creating the order while this page is open._
- An order open on another device shows — _Second device holding the order._
- Tapping an order held by another device is blocked (PEND-032) — _Second device holding the order._
- When device B leaves the order the — _Second device releasing the order._
- Device A completed the order; device B tapping its stale copy still sees Successful (PEND-034) — _Two devices with a stale copy._
- An order created on this device shows on the other device and on Portal (PEND-091) — _Second device + Portal._

## promo-split › Portal: fee / tax / point configuration (6)

- Promotion on an order with 2 × $105 gift cards keeps each card at $105 (VP-4160) (PROMO-073) — _Portal: SF 5% + Tax 10% + gift-card SF toggle off (store-wide config)._
- Tax is part of the points base; gift-card sales are excluded (VP-4171) (PROMO-081) — _Portal: Tax 10% + Other point rate $1.00._
- A reward lowers the points base (VP-3981) (PROMO-085) — _Portal reward + Other point rate $1.00._
- Card declined then Try Again approved: points earned once (VP-4377) (PROMO-087) — _Payment terminal (decline then approve)._
- Card declined → X → card again approved: points earned once (VP-4377) (PROMO-088) — _Payment terminal (decline, X, card again)._
- A method with a 0 point rate earns 0 points without an error (VP-3984) (PROMO-090) — _Portal: set a method's point rate to $0.00._

## promo-split › SPLIT: Portal config (5)

- Split lock for gift-card orders follows the order snapshot, not the current config (VP-4077) (SPLIT-008) — _Portal: change the gift-card SF toggle after an order was paid (store-wide)._
- By Amount: a Cash check is entered at the cash price, Card checks on the Card base (SPLIT-028) — _Portal: SF 3% fixture (PC-SP $100 → Card $103.00)._
- By Items: product tax lands only on the check holding the product (VP-3334) (SPLIT-035) — _Portal: a retail product with Product Tax._
- After a Cash check, the footer Total = cash paid + the open check (VP-4405) (SPLIT-069) — _Portal: SF 4% + CD 4% + product tax 10%, 2 products × $50._
- Audit Log records Complete / void / refund / partial refund of a split order (SPLIT-126) — _Portal Audit Log._

## app-rpt-set-perm-devm › Store-wide tip flow / Turn off (4)

- Turn value = 0 ẩn tab TURN và lượt trên card staff (mục Turn ở app sidebar vẫn còn) (SET-062) — _Changes the tip flow (Tip Amount $, Tip Method, Tip Timing) or turns Turn off (value 0) for every till of the merchant mid-day; the volt-qc _
- Lưu Tip Amount $ → màn hình khách hiện preset theo tiền (SET-080)  — _Changes the tip flow (Tip Amount $, Tip Method, Tip Timing) or turns Turn off (value 0) for every till of the merchant mid-day; the volt-qc _
- Bỏ Cash khỏi Tip Method → thanh toán Cash không hiện màn tip (SET-081) — _Changes the tip flow (Tip Amount $, Tip Method, Tip Timing) or turns Turn off (value 0) for every till of the merchant mid-day; the volt-qc _
- Tip Timing = After Payment bật nút Adjust Tip cho đơn chưa settle (SET-082) — _Changes the tip flow (Tip Amount $, Tip Method, Tip Timing) or turns Turn off (value 0) for every till of the merchant mid-day; the volt-qc _

## app-rpt-set-perm-devm › Promotions / Discount Setting (3)

- Promotion có sẵn lấy tỷ lệ từ Discount Setting; Custom Discount luôn reset 100/0 (SET-056) — _Needs configured promotions and a Discount Setting change checked against finished orders and Portal._
- Discount Charge của staff theo tỷ lệ mới, chỉ tính phần dòng service (VP-3436) (SET-057) — _Needs configured promotions and a Discount Setting change checked against finished orders and Portal._
- Đổi Discount Setting không thay đổi phân bổ của đơn đã hoàn tất (snapshot) (SET-058) — _Needs configured promotions and a Discount Setting change checked against finished orders and Portal._

## app-rpt-set-perm-devm › V2 / V4 report rollout (3)

- V2 phải khớp V1 100% (RPT-182) — _V2-vs-V1 parity, the /report-pages/$slug rollout and the 6-month range are checked by the VP-4848 V4 report QC pack against Portal data._
- Report pages /report-pages/$slug thay báo cáo cũ (RPT-183)  — _V2-vs-V1 parity, the /report-pages/$slug rollout and the 6-month range are checked by the VP-4848 V4 report QC pack against Portal data._
- Khoảng ngày tối đa 6 tháng (RPT-184) — _V2-vs-V1 parity, the /report-pages/$slug rollout and the 6-month range are checked by the VP-4848 V4 report QC pack against Portal data._

## oh-reopen › second POS / other device (3)

- An order completed on another device / Portal appears after sync without reload (OH-021) — _Needs a second POS (or Portal) completing the order while this till watches the list._
- Order status on POS matches server / Portal after sync (OH-088) — _Needs the server / Portal record to compare against after sync._
- Order changed elsewhere while the dialog is open → server rejects with an error toast (OH-129) — _Another device / Portal must change the order while the Cancel / Refund dialog is open here._

## app-rpt-set-perm-devm › Sync in flight (2)

- Chỉ báo — _The Syncing indicator / UI-during-sync only shows while a Portal-side change is being pulled; it cannot be triggered from the POS lane._
- UI Home vẫn thao tác được trong lúc sync, không bị flood lỗi hook (APP-093) — _The Syncing indicator / UI-during-sync only shows while a Portal-side change is being pulled; it cannot be triggered from the POS lane._

## oh-reopen › merchant data / build this device does not have (1)

- Order with a promotion / reward: reopen locks money edits, no apply / change of promo (RO-105) — _Merchant 14 has no promotion / reward rule that applies at the till, and cashback is off (Portal config)._

## promo-split › Re-open editing (locked on this build) (1)

- Checkout from an appointment keeps the customer and earns points + visit (VP-4135) (PROMO-101) — _Needs a Confirmed appointment with a customer today (booking / Portal), points from GoCheckin._
