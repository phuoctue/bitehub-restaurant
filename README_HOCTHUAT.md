# Phân Tích Nghiệp Vụ — BiteHub Restaurant

Mục đích: tài liệu phân tích nghiệp vụ (Business Analysis) cho hệ thống quản lý nhà hàng "BiteHub Restaurant". Tài liệu này gồm: tổng hợp nghiệp vụ chính, phân tích luồng hoạt động chi tiết theo chức năng, và bộ câu hỏi nghiệp vụ sâu để làm rõ yêu cầu.

## 1. Tổng hợp nghiệp vụ chính

**Mục tiêu hệ thống**
- Hỗ trợ vận hành toàn diện cho nhà hàng: tiếp nhận khách, đặt chỗ, gọi món, chế biến, thanh toán, quản lý nhân viên, báo cáo doanh thu, và tích hợp in ấn/thiết bị.
- Tối ưu trải nghiệm khách hàng (đặt bàn, gọi món nhanh qua QR, thanh toán đa phương thức).

**Đối tượng người dùng (Actors)**
- Khách hàng (On-site & Online)
- Nhân viên phục vụ (Waiter/Server)
- Thu ngân (Cashier)
- Bếp (Kitchen Staff)
- Quản lý nhà hàng (Manager)
- Quản trị hệ thống / Admin (Admin)
- Shipper / Giao hàng (nếu có module giao nhận)

**Module / Chức năng chính (status trong repo)**
- Xác thực & Quản lý tài khoản: **Implemented** (see server/src/controllers/auth.controller.ts, client api routes)
- Quét QR bàn (Table QR Check-in): **Implemented** (see client/src/components/qrcode-table.tsx, server/src/controllers/table.controller.ts)
- Đặt bàn / Đặt chỗ (Reservation): **Planned / Not implemented**
- Xem menu / Tùy chỉnh món / Combo: **Implemented** (see server/src/controllers/dish.controller.ts, client/manage/dishes pages)
- Khuyến mãi / Mã giảm giá / Loyalty: **Planned / Not implemented**
- Gọi món (Order Taking): **Implemented** (see server/src/controllers/order.controller.ts, client guest order pages)
- Giỏ hàng & Quản lý order: **Implemented** (hooks `useOrder`, manage orders pages)
- Thanh toán (Payments): **Partially implemented** (QR/invoice flows present, see client/src/lib/payment-qr.ts, server/.env.example)
- In hóa đơn (Invoice/PDF): **Implemented** (see server/src/controllers/invoice.controller.ts, server/src/utils/invoice.ts)
- Quản lý bàn: **Implemented** (see server/src/controllers/table.controller.ts, client/manage/tables pages)
- Báo cáo & Thống kê: **Partially implemented** (manage/analytics page exists)
- Quản lý nhân viên & ca làm việc: **Partially implemented** (accounts CRUD present; shift scheduling not implemented)
- Quản lý menu & kho (Inventory): **Planned / Not implemented**
- Delivery & Takeaway / Shipper: **Planned / Not implemented**
- Printer / KDS integration: **Planned / Not implemented**
- Refunds & Returns workflow: **Planned / Not implemented**
- Audit / SIEM integrations: **Partial** (basic logging utilities exist; full audit pipeline not present)

-- NOTE: The above status is based on code inspection of the repository. Use the "Implementation Evidence" section below for direct file references.

## 2. Phân tích luồng hoạt động (User Flow / Business Flow)

Lưu ý: mỗi chức năng mô tả theo cấu trúc: Mục đích, Actor, Pre-condition, Post-condition, Main Flow (bước), Alternative/Exception Flow, Tích hợp liên quan.

### A. Đăng nhập (Login)
- Mục đích: Xác thực người dùng để phân quyền chức năng và lưu phiên làm việc.
- Actor: Tất cả actors có tài khoản (Nhân viên, Thu ngân, Quản lý, Admin), Khách hàng (khi cần tài khoản cá nhân).
- Pre-condition: Thiết bị có kết nối mạng; người dùng có tài khoản (với Google hoặc email) nếu dùng xác thực; OTP/2FA sẵn sàng nếu bật.
- Post-condition: Người dùng được nhận token phiên; giao diện hiển thị theo vai trò.
- Main Flow:
	1. Người dùng mở màn hình đăng nhập.
	2. Chọn phương thức: Google / Email & Password / OTP.
	3. Hệ thống gọi API xác thực.
	4. Nếu xác thực thành công, hệ thống trả token & redirect theo role.
	5. Ghi log đăng nhập (user, device, timestamp).
- Alternative / Exception Flow:
	- Google OAuth lỗi: hiển thị thông báo, gợi ý thử lại.
	- Email/Password sai: hiển thị lỗi, cho phép reset password.
	- OTP hết hạn: gửi lại mã.
- Tích hợp liên quan: Google OAuth API, SMTP/SES (email reset), SMS provider (OTP), SSO (nếu có), log/audit service.

### B. Quét QR bàn ăn (Table QR Check-in)
- Mục đích: Gán khách vào bàn, khởi tạo session order tại bàn.
- Actor: Khách hàng (self check-in), Nhân viên phục vụ (check-in thay khách).
- Pre-condition: QR code dán ở bàn chứa mã bàn hợp lệ; thiết bị có camera và mạng; backend có mapping tableId.
- Post-condition: Tạo session-table active, hiển thị menu cho khách trên điện thoại; order có thể bắt đầu.
- Main Flow:
	1. Khách quét QR (chứa tableId và optional token/restaurantId).
	2. Ứng dụng mở trang menu với context tableId.
	3. Tùy chọn: khách login/không login — vẫn cho phép tạo order guest.
	4. Hệ thống tạo một TableSession (tableId, sessionId, startedAt, status=occupied).
	5. Hiển thị thông tin bàn/khuyến mãi.
- Alternative / Exception Flow:
	- QR lỗi/không hợp lệ: hiển thị lỗi, hướng dẫn gọi phục vụ.
	- Bàn đã có session active: hỏi có muốn ghép vào session hiện tại hay tạo session mới (permission required).
- Tích hợp: QR generator, URL deep link handling, POS API for table mapping, analytics.

### C. Đặt bàn / Đặt chỗ (Reservation)
- Mục đích: Khách đặt trước thời gian, quản lý công suất.
- Actor: Khách hàng, Nhân viên lễ tân/phone operator, Quản lý.
- Pre-condition: Danh sách bàn & lịch trống được cập nhật; khách cung cấp thông tin liên hệ.
- Post-condition: Tạo reservation record (status: pending/confirmed/cancelled).
- Main Flow:
	1. Khách chọn ngày/giờ, số người, yêu cầu đặc biệt.
	2. Hệ thống kiểm tra availability theo rãnh của bàn/ca.
	3. Gợi ý bàn phù hợp hoặc giữ chỗ tạm thời.
	4. Khách xác nhận; hệ thống gửi email/SMS xác nhận.
	5. Reservation ghi vào lịch và block slot.
- Alternative/Exception Flow:
	- Không có bàn trống: gợi ý giờ khác hoặc đăng ký chờ.
	- Khách hủy muộn: áp dụng chính sách no-show/penalty nếu có.
- Tích hợp: Calendar sync (Google Calendar cho quản lý), SMS/Email provider, POS table map.

### D. Gọi món (Order Taking)
- Mục đích: Tạo order từ khách, gửi tới bếp, theo dõi trạng thái chuẩn bị.
- Actor: Khách hàng (qua QR/self-order), Nhân viên phục vụ (via POS/tablet), Thu ngân (for finalization), Bếp (consume kitchen tickets).
- Pre-condition: Table session active hoặc order type (takeaway/delivery) được chọn; menu & giá hợp lệ.
- Post-condition: Order lưu vào hệ thống với trạng thái (placed -> preparing -> ready -> served -> closed).
- Main Flow:
	1. Khách/nhân viên duyệt menu, thêm món vào giỏ, có thể tuỳ chỉnh (notes, size, toppings).
	2. Xác nhận order: chọn cách phục vụ (tại bàn, mang đi, giao hàng).
	3. Hệ thống tạo orderId, tính tạm tính, tạo Kitchen Ticket.
	4. Gửi thông báo tới màn hình bếp (KDS) và in order kitchen receipt nếu cần.
	5. Bếp cập nhật trạng thái item/order.
- Alternative/Exception Flow:
	- Món hết hàng: hiển thị unavailable, gợi ý thay thế.
	- Khách muốn sửa order đã gửi: cho phép chỉnh sửa trong window cho phép; nếu quá muộn, tạo extra order hoặc yêu cầu manager.
	- Connectivity loss: cho phép offline cache trên POS, đồng bộ khi có mạng.
- Tích hợp: Menu API, Inventory API (availability), Kitchen Display System (KDS), Thermal Printer (kitchen), Notification service.

### E. Xem menu, tùy chỉnh món ăn, combo
- Mục đích: Hiển thị menu, cho phép khách chọn tuỳ chọn, combo và giá động.
- Actor: Khách hàng, Nhân viên quản trị (quản lý menu).
- Pre-condition: Menu được cấu hình, ảnh & mô tả có sẵn; rules cho options/combos.
- Post-condition: Lựa chọn được thêm vào giỏ với giá đúng.
- Main Flow:
	1. Hiển thị danh mục, bộ lọc (ăn chay, spicy, hợp combo).
	2. Chọn món -> mở modal tùy chỉnh (size, add-ons, notes) -> add to cart.
	3. Combo: chọn combo, đảm bảo ràng buộc (số món, thay đổi thành phần).
- Alternative/Exception Flow:
	- Tuỳ chọn xung đột (ví dụ allergen rules): cảnh báo, chặn lựa chọn.
	- Giá thay đổi thời gian thực: cảnh báo khách nếu giá cập nhật khi check-out.
- Tích hợp: CMS hoặc Admin API (menu management), Media CDN, Pricing rules engine, Allergy/Ingredient DB.

### F. Quản lý giỏ hàng / Order
- Mục đích: Cho phép sửa, xóa, thêm note, áp dụng mã giảm giá, xem tổng tạm tính.
- Actor: Khách hàng, Nhân viên phục vụ, Thu ngân.
- Pre-condition: Session active; item availability chưa bị lock out.
- Post-condition: Order final hoặc tạm lưu (draft) chờ thanh toán.
- Main Flow:
	1. Thêm/xóa/move item; cập nhật quantity.
	2. Áp dụng coupon / loyalty points.
	3. Kiểm tra tổng (phí service, VAT, giảm giá).
	4. Checkout -> chuyển sang thanh toán.
- Alternative/Exception Flow:
	- Coupon không hợp lệ/hết hạn: hiển thị lỗi.
	- Conflict khi nhiều user edit: show conflict resolution (last write / lock mechanism).
- Tích hợp: Promotion engine, Loyalty service, Pricing and Tax API.

### G. Thanh toán (Payments)
- Mục đích: Xử lý thanh toán đa kênh, đảm bảo an toàn và ghi nhận giao dịch.
- Actor: Khách hàng, Thu ngân, Hệ thống tự động (ví dụ autopay cho delivery).
- Pre-condition: Order in status ready-for-payment; payment providers config.
- Post-condition: Payment confirmed/failed; order status -> paid -> closed; gửi hoá đơn điện tử.
- Main Flow:
	1. Khách chọn phương thức: Cash / Card (POS) / Card Online / Bank transfer / E-wallet.
	2. Nếu card online: redirect hoặc iframe tới payment gateway; xác thực 3DS nếu cần.
	3. Payment gateway trả về result -> system updates order payment status.
	4. In hóa đơn & gửi e-receipt (email/SMS).
- Alternative/Exception Flow:
	- Transaction failed: retry, chọn PP khác, hoặc manual payment record (thu ngân).
	- Partial payment / split bill: hỗ trợ nhiều phương thức/nguồn thanh toán cho một order.
- Tích hợp: Payment Gateway (Stripe/VNPay/MoMo/OnePay), POS terminal providers, Accounting export, E-invoice providers.

### H. In hóa đơn (Kitchen Receipt & Customer Bill)
- Mục đích: In order cho bếp và hóa đơn cho khách.
- Actor: Hệ thống (tự động khi order), Thu ngân (khi thanh toán), Bếp.
- Pre-condition: Order tạo Kitchen Ticket; máy in kết nối và cấu hình đúng printer profiles.
- Post-condition: Kitchen receipt printed; customer bill printed/emailed.
- Main Flow:
	1. Order placed -> generate kitchen ticket (group by printer routing rules).
	2. Gửi lệnh in đến thermal printer (kitchen) hoặc KDS.
	3. Khi thanh toán -> generate customer bill -> in hoặc gửi e-receipt.
- Alternative/Exception Flow:
	- Printer offline: gửi bản copy lên KDS, queue print job, cảnh báo admin.
	- Paper jam/error: thông báo cho nhân viên và log sự cố.
- Tích hợp: ESC/POS printers, Printer drivers, KDS, Print queue service.

### I. Chuyển bàn, tách bàn
- Mục đích: Quản lý di chuyển khách giữa các bàn, ghép/tách order khi cần.
- Actor: Nhân viên phục vụ, Quản lý.
- Pre-condition: Bàn nguồn có session active; bàn đích có capacity phù hợp.
- Post-condition: TableSession cập nhật tableId mới; order mapping updated; in/notify nếu cần.
- Main Flow:
	1. Chọn order/table -> chọn chuyển/break-up.
	2. Hệ thống kiểm tra availability & rules (max capacity).
	3. Thực hiện chuyển: update session and table occupancy; nếu tách -> duplicate order hoặc split items to new order.
	4. Notify bếp/thu ngân nếu cần.
- Alternative/Exception Flow:
	- Bàn đích đã có active session: yêu cầu ghép hoặc từ chối.
	- Đang có thanh toán đang xử lý: chặn chuyển cho đến khi hoàn tất.
- Tích hợp: POS table map, Notification service, Print (nếu cần kitchen tickets mới).

### J. Báo cáo doanh thu, thống kê
- Mục đích: Cung cấp dashboard cho quản lý xem doanh thu, lợi nhuận, món bán chạy, hiệu suất nhân viên.
- Actor: Quản lý, Admin, Kế toán.
- Pre-condition: Dữ liệu order, payment, shift, inventory được ghi lại và đồng bộ.
- Post-condition: Báo cáo sinh ra (realtime hoặc theo lịch), export CSV/Excel/PDF.
- Main Flow:
	1. Người dùng chọn tiêu chí (khoảng thời gian, outlet, ca, kênh bán).
	2. Hệ thống truy vấn data warehouse / reporting DB, tính toán KPIs.
	3. Hiển thị đồ thị và bảng; cho phép drill-down và export.
- Alternative/Exception Flow:
	- Dữ liệu thiếu/hỏng: báo lỗi hoặc gợi ý re-run ETL.
- Tích hợp: BI tools, Data warehouse, Accounting system, CSV/Excel export.

### K. Quản lý nhân viên & ca làm việc
- Mục đích: Quản lý profile nhân viên, phân ca, phân quyền, chấm công cơ bản.
- Actor: Admin, Quản lý, Nhân viên.
- Pre-condition: Danh sách roles & permissions; policy ca làm việc.
- Post-condition: Shift schedule, attendance logs, báo cáo lương/ca.
- Main Flow:
	1. Admin tạo nhân viên & phân quyền.
	2. Quản lý lên lịch ca theo tuần/tháng.
	3. Nhân viên check-in/out (POS app hoặc web) -> tạo attendance record.
	4. Tổng hợp giờ công cho payroll.
- Alternative/Exception Flow:
	- Nhân viên quên check-in: admin can adjust time with note and approval.
- Tích hợp: Payroll/HR system, Biometric/Attendance devices (nếu có).

### L. Các chức năng bổ sung quan trọng
- Quản lý menu & kho nâng cao (sync inventory khi bán).
- Khuyến mãi, mã giảm giá, voucher, loyalty program.
- Delivery & Takeaway workflow + tích hợp shipper/3PL.
- Refunds & Returns, Complaints handling.
- Audit logs & security (role-based access control, audit trail).

## 3. Bộ câu hỏi nghiệp vụ sâu (Questions to Clarify Requirements)

Lưu ý: trả lời càng nhiều càng tốt — giúp chuyển requirements sang user stories & acceptance criteria.

1) Quy trình kinh doanh chung
- Nhà hàng có nhiều outlet/khu vực không? (multi-outlet support)
- Mô hình bàn: fixed tables hay flexible (movable seats)?
- Có chính sách no-show / cancellation fee cho reservation không?
- Có giờ cao điểm (peak hours) và pricing khác nhau theo giờ không?

2) Quy tắc về đặt bàn / table session
- Thời gian mặc định một session cho một bàn là bao lâu?
- Cho phép khách tự ghép bàn qua app khi nhóm lớn không?
- Khi bàn đã full, có cho phép chờ queue/standby không?

3) Order & Menu rules
- Có giới hạn thời gian chỉnh sửa order sau khi gửi không?
- Làm sao xử lý modifications liên quan tới kitchen (ví dụ đổi món đã bắt chế biến)?
- Có hỗ trợ combo với giá động hoặc upsell suggestions không?
- Cần hỗ trợ allergen warnings hoặc thành phần dinh dưỡng?

4) Thanh toán
- Thanh toán split-bill: có bao nhiêu cách chia (per-item, per-person, percent)?
- Hỗ trợ tip / service charge tự động không? Tỷ lệ thay đổi theo outlet?
- Cần lưu chứng từ điện tử theo chuẩn hóa (e-invoice) không? Nếu có, theo quy định nào?
- Các payment gateway ưu tiên là gì (Stripe, VNPay, MoMo, OnePay, POS provider)?

5) In ấn & thiết bị
- Danh sách loại máy in và giao thức cần hỗ trợ (ESC/POS, CUPS, Network printers)?
- Có KDS (Kitchen Display System) hay chỉ in paper tickets?
- Yêu cầu về failover nếu printer/KDS offline?

6) Báo cáo & KPI
- KPIs quan trọng: doanh thu theo ca, table turnover, thời gian chuẩn bị trung bình, món bán chạy.
- Cần báo cáo theo outlet/chi nhánh hay theo từng khu vực trong outlet?
- Bao lâu cần báo cáo realtime vs scheduled (daily/weekly/monthly)?

7) Nhân viên & phân quyền
- Danh sách roles chi tiết và quyền tương ứng (ví dụ: Waiter: tạo order, không xóa; Manager: chỉnh sửa order; Admin: manage settings).
- Cần audit trail đầy đủ cho các hành động sensitive không (void bill, price override)?

8) Tích hợp hệ thống bên thứ ba
- Có sẵn payment gateway(s) muốn tích hợp? Cần hỗ trợ 3DS & recurring? 
- Có hệ thống kế toán hiện hữu để export hóa đơn/phiếu thu không? Yêu cầu định dạng export?
- Dùng dịch vụ SMS/Email nào để gửi thông báo/hoá đơn?

9) Exception flows & error handling
- Chính sách khi inventory mismatch (sell-through when stock shows available)?
- Xử lý giao dịch lặp (duplicate payment) như thế nào?
- Quy trình hoàn tiền/refund: ai phê duyệt, thời hạn, tài khoản trả về?

10) Bạn yêu cầu / ưu tiên tính năng nâng cao?
- Offline-first POS capability (điều kiện vận hành nếu mất Internet)?
- Multi-currency hoặc multi-language support? (vi/ en)
- Automation: tự động đóng order sau X phút không phản hồi?

---

M. Quản lý menu & kho nâng cao (Inventory & Stock Sync)
- Mục đích: Quản lý tồn kho, đồng bộ số lượng khi bán và cảnh báo khi sắp hết.
- Actor: Quản lý, Nhân viên kho, Thu ngân, Hệ thống tự động (sync service).
- Pre-condition: Danh sách nguyên liệu và mapping món->nguyên liệu được cấu hình; tồn kho ban đầu đã nhập.
- Post-condition: Tồn kho cập nhật theo bán hàng; cảnh báo low-stock và tự động tạo yêu cầu nhập hàng nếu cần.
- Main Flow:
		1. Khi order confirmed -> hệ thống trừ tồn kho theo công thức món->nguyên liệu.
		2. Nếu tồn kho xuống dưới ngưỡng cảnh báo -> tạo alert cho quản lý và gửi email/SMS nếu cấu hình.
		3. Quản lý có thể điều chỉnh tồn, ghi nhận nhập kho, hoặc phân bổ nguyên liệu giữa outlets.
		4. Đồng bộ với hệ thống bên ngoài (WMS / ERP) theo lịch hoặc sự kiện.
- Alternative/Exception Flow:
		- Mismatch stock (khác giữa hệ thống và kiểm kê thực tế): cho phép điều chỉnh có ghi chú và audit trail.
		- Giao dịch trùng lặp/rollback: hỗ trợ transaction undo hoặc manual correction.
- Tích hợp: ERP/WMS sync, Barcode/Scanner, Supplier API, Inventory reports.

N. Khuyến mãi, mã giảm giá, loyalty (Promotions & Loyalty)
- Mục đích: Quản lý chương trình khuyến mãi, mã giảm giá và chương trình tích điểm.
- Actor: Quản lý marketing, Thu ngân, Khách hàng.
- Pre-condition: Các campaign/ma giảm giá được cấu hình với điều kiện áp dụng (thời gian, sản phẩm, outlet).
- Post-condition: Giảm giá áp dụng cho đơn hàng hợp lệ; điểm thưởng cộng khi hoàn thành đơn.
- Main Flow:
		1. Khi khách áp dụng mã hoặc đủ điều kiện campaign -> hệ thống validate rule và tính toán giảm giá.
		2. Nếu áp dụng loyalty -> ghi nhận điểm earned, cập nhật balance khách hàng.
		3. Khi thanh toán -> trừ điểm hoặc áp dụng voucher, ghi log giao dịch khuyến mãi.
- Alternative/Exception Flow:
		- Mã hết hạn/không hợp lệ: hiển thị lý do và gợi ý mã thay thế.
		- Conflict giữa nhiều promo: áp dụng chính sách ưu tiên (stacking rules).
- Tích hợp: CRM, Email marketing, Coupon engines, Loyalty providers.

O. Delivery & Takeaway
- Mục đích: Quản lý đơn giao hàng và mang đi, tích hợp shipper & theo dõi trạng thái.
- Actor: Khách hàng, Thu ngân, Shipper, Quản lý.
- Pre-condition: Danh sách shipper/đối tác sẵn sàng; phí ship được cấu hình.
- Post-condition: Đơn giao hàng tạo shipment record, có tracking và trạng thái giao.
- Main Flow:
		1. Khách chọn delivery và nhập địa chỉ; hệ thống ước lượng phí & thời gian.
		2. Order confirmed -> lựa chọn shipper tự động hoặc thủ công; tạo shipment và gửi thông tin pick-up.
		3. Shipper nhận đơn -> cập nhật trạng thái (picked -> enroute -> delivered).
		4. Khách nhận hàng -> xác nhận delivery -> system close order.
- Alternative/Exception Flow:
		- Không có shipper khả dụng: offer delayed slots hoặc chuyển sang pickup.
		- Shipper hủy/late: reassign hoặc refund partial if necessary.
- Tích hợp: 3PL APIs, in manifest, delivery tracking, maps/routing.

P. Refunds, Returns & Complaints
- Mục đích: Xử lý hoàn tiền, đổi/hoàn món, và khiếu nại khách hàng.
- Actor: Thu ngân, Manager, Customer Support, Khách hàng.
- Pre-condition: Chính sách refund/return rõ ràng; bằng chứng yêu cầu (photo, invoice).
- Post-condition: Refund record với trạng thái (requested -> approved -> processed) và audit trail.
- Main Flow:
		1. Khách yêu cầu refund/complaint -> tạo ticket với thông tin order, ảnh, mô tả.
		2. Thu ngân/manager kiểm tra và phê duyệt hoặc từ chối theo chính sách.
		3. Nếu approved -> thực hiện refund qua cùng kênh thanh toán hoặc store credit; ghi log.
		4. Thông báo kết quả cho khách và cập nhật báo cáo.
- Alternative/Exception Flow:
		- Fraud detection: hold & escalate to manager.
		- Partial refund / item-level refund: ghi nhận chi tiết item và phí liên quan.

Q. Audit, Security & Compliance
- Mục đích: Đảm bảo an toàn dữ liệu, truy vết hành động và tuân thủ quy định.
- Actor: Admin, Security Officer, Auditor.
- Pre-condition: Roles & permission model defined; logging infra active.
- Post-condition: Mọi hành động nhạy cảm có audit trail, alerts cho suspicious activity.
- Main Flow:
		1. Hệ thống ghi logs cho login, voids, price overrides, refunds, và thay đổi cấu hình.
		2. Cấu hình retention policy cho logs và cơ chế export cho kiểm toán.
		3. Phát hiện hành vi bất thường: multiple failed logins, large refunds -> tạo alert.
- Alternative/Exception Flow:
		- Data breach: trigger incident response, revoke keys, notify stakeholders.
- Tích hợp: SIEM, Audit export, Role-based Access Control (RBAC), 2FA/SSO.

## 4. Bộ câu hỏi nghiệp vụ (mở rộng và chi tiết theo module)

Lưu ý: phần này mở rộng các câu hỏi đã liệt kê ở trên, nhóm theo chức năng để dễ chuyển thành user stories.

- **General / Multi-outlet:**
	- Nhà hàng có bao nhiêu outlet/chi nhánh? Có cần dashboard tổng hợp multi-outlet không?
	- Outlet có chia theo khu vực (floor, zone) không? Có cần sync inventory giữa outlets?

- **Tables & Sessions:**
	- Thời lượng mặc định của một session (ví dụ 90 phút)? Có tự động giải phóng sau X phút không?
	- Cần hỗ trợ đặt trước nhiều bàn cho một booking không? Quy tắc ghép/break-up cụ thể?

- **Orders & Menu:**
	- Thời gian cho phép chỉnh sửa order sau khi gửi là bao lâu (ví dụ 2 phút, 10 phút)?
	- Các tùy chọn món có ràng buộc phức tạp (ví dụ phải chọn 2 trong 4) cần biểu diễn thế nào?
	- Cần tính thời gian chế biến ước tính trên từng item không? Có hiển thị ETA cho khách?

- **Inventory:**
	- Mọi món có mapping rõ ràng đến nguyên liệu không? Ai chịu trách nhiệm duy trì mapping?
	- Chính sách khi inventory negative: auto-disable item hay allow oversell với cảnh báo?
	- Tần suất và hình thức kiểm kê định kỳ (daily/weekly/manual)? Cần hỗ trợ barcode scanning?

- **Promotions & Loyalty:**
	- Có loại khuyến mãi nào cần hỗ trợ: percentage, fixed-amount, buy-X-get-Y, time-based?
	- Luật chồng khuyến mãi: cho phép stack hay chỉ áp dụng cao nhất? Có ưu tiên theo campaign?
	- Loyalty: tích điểm theo doanh thu hay theo item? Có expiration cho điểm?

- **Payments & Billing:**
	- Cần hỗ trợ split-bill theo item, bằng % hay share equally? Có giới hạn số phần chia?
	- Hình thức tip: fixed, percentage, pre-set options, hay custom amount? Có tax trên tip?
	- Yêu cầu e-invoice theo định dạng nào (VN-specific)? Có cần gửi file XML tới cơ quan thuế?

- **Printing & KDS:**
	- Danh sách printer cần hỗ trợ: ESC/POS (network/USB), CUPS, cloud-print?
	- Routing rules: item/lane -> printer mapping như thế nào (ví dụ drinks->bar printer)?
	- Có cần retry/queue khi printer offline không? Cơ chế fallback là gì?

- **Delivery & Takeaway:**
	- Có tích hợp shipper nội bộ hay dùng đối tác bên ngoài? Cần auto-assign hay thủ công?
	- Cần ước lượng thời gian giao chính xác theo traffic/zone không? Tích hợp maps?

- **Refunds & Complaints:**
	- Ai có quyền approve refund theo số tiền (ví dụ <100k: cashier, >100k: manager)?
	- Cần multi-step approval workflow không? Có lưu mẫu lý do refund để báo cáo?

- **Staff & Shifts:**
	- Cơ chế chấm công: POS check-in/out hay external biometric? Có overtime rules?
	- Ai có quyền override giờ công hoặc chấm công thay? Cần audit cho các sửa đổi không?

- **Reporting & KPIs:**
	- KPIs chính: turnover per table, avg ticket time, avg cook time, top-selling items — cần phạm vi thời gian nào?
	- Cần export theo định dạng nào (CSV, Excel, PDF) và tần suất scheduled reports?

- **Security & Compliance:**
	- Các hành động nhạy cảm nào cần 2FA hoặc approval (price override, void bill)?
	- Retention policy cho logs bao lâu? Cần cơ chế purge theo quy định bảo mật không?

- **Integration & Ops:**
	- Danh sách hệ thống bên thứ ba bắt buộc (accounting, payment, SMS/email, ERP)?
	- Cần SLA cho các job nền (sync inventory, print jobs)? Cơ chế retry/backoff?

---

Ghi chú tiếp theo: Tôi đã hoàn thiện phân tích luồng cho các chức năng còn lại (Inventory, Promotions, Delivery, Refunds, Audit) và mở rộng bộ câu hỏi theo module. Muốn tôi tiếp tục: 1) phân tách thành user stories + acceptance criteria, 2) tạo template issue/PR để chuyển cho dev, hay 3) xuất file Word/PDF mẫu để gửi cho stakeholder?
