# BÁO CÁO ĐỒ ÁN CƠ SỞ

## Đề tài
**BiteHub Restaurant - Hệ thống quản lý nhà hàng và gọi món bằng mã QR**

---

## LỜI MỞ ĐẦU

### 1. Lý do chọn đề tài
Trong bối cảnh chuyển đổi số đang diễn ra mạnh mẽ trong lĩnh vực dịch vụ ăn uống, các mô hình nhà hàng truyền thống tại Việt Nam vẫn còn phụ thuộc nhiều vào quy trình thủ công, bao gồm ghi nhận món bằng giấy, giao tiếp tác vụ qua hình thức truyền miệng, đối soát hóa đơn cuối ca bán hàng và tổng hợp báo cáo doanh thu theo phương pháp thủ công. Các phương thức này không chỉ làm tăng áp lực vận hành đối với đội ngũ nhân sự mà còn tiềm ẩn nhiều sai sót trong quá trình phục vụ, đặc biệt vào các khung giờ cao điểm.

Từ thực tiễn đó, nhóm thực hiện lựa chọn đề tài **“BiteHub Restaurant - Hệ thống quản lý nhà hàng và gọi món bằng mã QR”** với định hướng xây dựng một nền tảng quản lý tập trung, cho phép khách hàng chủ động gọi món theo bàn thông qua mã QR, đồng thời hỗ trợ nhân viên và quản lý theo dõi trạng thái đơn hàng theo thời gian thực, thực hiện thanh toán, xuất hóa đơn tự động và khai thác dữ liệu phục vụ điều hành.

### 2. Mục đích nghiên cứu
Đồ án hướng đến các mục đích chính sau:
- Xây dựng hệ thống web quản lý nhà hàng theo kiến trúc client-server hiện đại, tách biệt frontend và backend.
- Số hóa quy trình gọi món tại bàn bằng cơ chế quét mã QR và đăng nhập Guest theo token bàn.
- Chuẩn hóa vòng đời xử lý đơn hàng từ tạo đơn, chế biến, phục vụ đến thanh toán.
- Tổ chức dữ liệu vận hành nhà hàng theo mô hình quan hệ, bảo đảm tính nhất quán và khả năng mở rộng.
- Cung cấp công cụ thống kê, hỗ trợ nhà quản trị đưa ra quyết định dựa trên dữ liệu.

### 3. Ý nghĩa khoa học và thực tiễn
Về phương diện học thuật, đề tài là sự kết hợp của nhiều nội dung cốt lõi trong lĩnh vực Công nghệ thông tin: phân tích thiết kế hệ thống, mô hình hóa cơ sở dữ liệu, phát triển API, cơ chế xác thực và phân quyền, truyền thông thời gian thực, và sinh chứng từ số.

Về phương diện thực tiễn, sản phẩm có thể áp dụng cho các cơ sở F&B quy mô nhỏ và vừa, góp phần nâng cao hiệu suất phục vụ, cải thiện trải nghiệm khách hàng, đồng thời giảm tải công việc thủ công cho nhân viên vận hành.

### 4. Cấu trúc báo cáo
Báo cáo được tổ chức thành các chương như sau:
- **Chương 1**: Tổng quan bài toán, khảo sát hiện trạng và cơ sở công nghệ.
- **Chương 2**: Phân tích, thiết kế hệ thống, bao gồm mô hình dữ liệu, use-case, kiến trúc và giao diện.
- **Chương 3**: Kết quả thực hiện, đánh giá vận hành và đối chiếu mục tiêu.
- **Chương 4**: Kết luận, hạn chế và định hướng phát triển.

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI

### 1.1. Tổng quan bài toán quản lý nhà hàng

#### 1.1.1. Đặc thù nghiệp vụ nhà hàng tại chỗ
Nghiệp vụ nhà hàng phục vụ tại bàn có các đặc trưng điển hình: luồng khách biến động theo khung giờ, vòng đời đơn hàng ngắn nhưng số lượng giao dịch lớn, yêu cầu phản hồi nhanh giữa nhiều vai trò (khách hàng, nhân viên phục vụ, thu ngân, quản lý), đồng thời cần bảo đảm tính chính xác cao trong khâu chế biến và thanh toán.

#### 1.1.2. Bất cập của mô hình vận hành truyền thống
Qua khảo sát thực tế, nhóm thực hiện nhận thấy một số vấn đề phổ biến:
- Thông tin món gọi được ghi nhận rời rạc, khó truy vết khi cần đối soát.
- Trạng thái đơn không được đồng bộ tức thời giữa khu vực khách và khu vực xử lý.
- Việc tổng hợp báo cáo doanh thu, món bán chạy, hiệu suất phục vụ tốn nhiều thời gian.
- Thiếu dữ liệu lịch sử có cấu trúc để phục vụ phân tích nghiệp vụ.

#### 1.1.3. Nhu cầu số hóa và hướng tiếp cận
Nhu cầu thực tiễn đặt ra là xây dựng một hệ thống có khả năng:
- Chuẩn hóa đầu vào nghiệp vụ thông qua định danh bàn và món ăn.
- Đồng bộ trạng thái tức thời để hạn chế sai lệch thông tin.
- Tự động hóa các khâu thanh toán, chứng từ và thống kê.
- Bảo đảm an toàn truy cập theo từng vai trò nghiệp vụ.

Trên cơ sở đó, BiteHub được định hướng như một nền tảng quản lý tập trung, lấy trải nghiệm khách hàng và hiệu quả vận hành làm trọng tâm.

### 1.2. Khảo sát hiện trạng và thách thức tại nhà hàng Việt Nam

#### 1.2.1. Thực trạng vận hành
Nhiều cơ sở nhà hàng tại Việt Nam, đặc biệt ở nhóm quy mô nhỏ và vừa, vẫn đang duy trì quy trình dựa trên giấy tờ hoặc công cụ rời rạc. Trong các tình huống đông khách, các thao tác thủ công có xu hướng gia tăng độ trễ và sai sót, tác động trực tiếp đến chất lượng phục vụ.

#### 1.2.2. Các thách thức chính
- Khó kiểm soát thứ tự ưu tiên và trạng thái xử lý đơn.
- Mất tính nhất quán dữ liệu khi thực đơn thay đổi nhưng đơn cũ cần lưu theo giá trị lịch sử.
- Hạn chế khả năng đánh giá hiệu quả món ăn theo thời gian.
- Thiếu cơ chế phân quyền linh hoạt cho chủ quán, nhân viên và khách hàng.

#### 1.2.3. Yêu cầu đặt ra cho hệ thống
Một hệ thống phù hợp cần đáp ứng đồng thời các tiêu chí:
- Vận hành trực quan, dễ sử dụng trong môi trường thực tế.
- Hỗ trợ realtime nhằm giảm độ trễ truyền thông.
- Có khả năng mở rộng chức năng và hạ tầng triển khai.
- Bảo đảm tính đúng đắn dữ liệu và an toàn truy cập.

### 1.3. Mục tiêu, phạm vi và đối tượng của đề tài

#### 1.3.1. Mục tiêu tổng quát
Xây dựng hệ thống web quản lý nhà hàng theo hướng số hóa toàn diện, bao phủ quy trình gọi món - xử lý đơn - thanh toán - thống kê.

#### 1.3.2. Mục tiêu cụ thể
- Quản lý tài khoản nhân sự theo vai trò `Owner/Employee`.
- Quản lý danh mục món ăn, quản lý bàn và import dữ liệu qua Excel.
- Hỗ trợ khách quét QR theo bàn để đăng nhập Guest và gọi món.
- Cập nhật trạng thái đơn hàng realtime theo luồng vận hành.
- Thanh toán tập trung theo khách/bàn và sinh hóa đơn PDF.
- Cung cấp dashboard doanh thu và hiệu suất món ăn.

#### 1.3.3. Phạm vi triển khai
Đề tài tập trung vào nhà hàng phục vụ tại bàn với quy mô nhỏ đến vừa; chưa bao gồm các phân hệ nâng cao như quản lý kho định mức chuyên sâu hoặc tích hợp trực tiếp với cổng thanh toán bên thứ ba.

### 1.4. Cơ sở công nghệ sử dụng trong hệ thống

#### 1.4.1. Frontend
- **Next.js 16 (App Router)**: tổ chức route theo vùng public, guest và quản trị; hỗ trợ tối ưu trải nghiệm điều hướng.
- **React 19 + TypeScript**: phát triển giao diện theo thành phần, tăng độ an toàn kiểu dữ liệu.
- **Tailwind CSS**: xây dựng giao diện nhanh, nhất quán.
- **TanStack Query**: quản lý trạng thái đồng bộ với API.
- **Zustand**: quản lý trạng thái ứng dụng nhẹ, phù hợp kết nối socket và trạng thái xác thực.
- **Socket.IO Client**: nhận sự kiện realtime từ backend.

#### 1.4.2. Backend
- **Fastify 4 + TypeScript**: xây dựng API hiệu năng cao với kiến trúc plugin và hook rõ ràng.
- **Schema validation**: chuẩn hóa dữ liệu vào/ra, giảm lỗi nghiệp vụ phát sinh.

#### 1.4.3. Cơ sở dữ liệu và ORM
- **PostgreSQL**: hệ quản trị quan hệ ổn định, phù hợp dữ liệu giao dịch.
- **Prisma ORM**: mô hình hóa dữ liệu, migration và thao tác truy vấn an toàn.

#### 1.4.4. Xác thực, realtime và chứng từ
- **JWT**: Access Token + Refresh Token cho tài khoản nội bộ.
- **Table Token**: token bàn phục vụ đăng nhập Guest tại chỗ.
- **Socket.IO**: đồng bộ sự kiện `new-order`, `update-order`, `payment`, `refresh-token`, `logout`.
- **PDFKit**: tạo hóa đơn PDF tự động sau thanh toán.

#### 1.4.5. Triển khai hệ thống
- **Docker + docker-compose**: đóng gói và triển khai đồng bộ các dịch vụ `client`, `server`, `postgres`.

### 1.5. Kết luận chương
Chương 1 đã trình bày bối cảnh hình thành đề tài, phân tích các bất cập của quy trình vận hành nhà hàng truyền thống, xác định mục tiêu nghiên cứu và làm rõ nền tảng công nghệ được lựa chọn. Đây là cơ sở để chuyển sang chương 2 với nội dung phân tích và thiết kế hệ thống ở mức chi tiết.

---

## CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 2.1. Phân tích yêu cầu hệ thống

#### 2.1.1. Tác nhân hệ thống
Hệ thống xác định ba nhóm tác nhân:
- **Owner**: quản trị tổng thể dữ liệu và vận hành.
- **Employee**: xử lý tác vụ nghiệp vụ hằng ngày.
- **Guest**: khách hàng tại bàn thực hiện gọi món.

#### 2.1.2. Yêu cầu chức năng
- Xác thực và phân quyền theo vai trò.
- Quản lý tài khoản nhân sự.
- Quản lý món ăn và bàn.
- Quản lý đơn hàng, cập nhật trạng thái theo quy trình phục vụ.
- Thanh toán và phát sinh hóa đơn.
- Thống kê dashboard theo khoảng thời gian.

#### 2.1.3. Yêu cầu phi chức năng
- Đáp ứng nhanh trong thao tác gọi món và cập nhật trạng thái.
- Bảo đảm tính nhất quán dữ liệu đơn hàng.
- Hỗ trợ mở rộng theo module và theo quy mô sử dụng.
- Bảo mật truy cập và kiểm soát quyền theo endpoint.

### 2.2. Thiết kế use-case nghiệp vụ

#### 2.2.1. Use-case vai trò Owner
Owner có các nghiệp vụ:
- Quản lý nhân sự (thêm/sửa/xóa nhân viên, cập nhật thông tin).
- Quản lý thực đơn và bàn.
- Theo dõi và can thiệp quy trình đơn hàng.
- Truy cập dashboard tổng hợp.

**Hình 2.1. Use-case vai trò Owner**

#### 2.2.2. Use-case vai trò Employee
Employee có các nghiệp vụ:
- Theo dõi danh sách order theo thời gian thực.
- Cập nhật trạng thái đơn: `Pending -> Processing -> Delivered -> Paid`.
- Tạo order thay mặt khách khi cần hỗ trợ tại quầy.
- Thực hiện thanh toán và in/tải hóa đơn.

**Hình 2.2. Use-case vai trò Employee**

#### 2.2.3. Use-case vai trò Guest
Guest có các nghiệp vụ:
- Đăng nhập theo bàn bằng mã QR/token.
- Xem menu khả dụng.
- Chọn món, nhập số lượng và gửi đơn.
- Theo dõi trạng thái các đơn đã gửi.

**Hình 2.3. Use-case vai trò Guest**

### 2.3. Thiết kế cơ sở dữ liệu

#### 2.3.1. Tổng quan mô hình ERD
Hệ thống sử dụng mô hình dữ liệu quan hệ với các thực thể cốt lõi: `Account`, `Dish`, `DishSnapshot`, `Table`, `Guest`, `Order`, `RefreshToken`, `Socket`.

Điểm thiết kế nổi bật là thực thể `DishSnapshot`, cho phép lưu lại bản chụp thông tin món tại thời điểm phát sinh order nhằm bảo toàn tính lịch sử và phục vụ đối soát chính xác ngay cả khi menu gốc thay đổi.

**Hình 2.4. Mô hình ERD hệ thống BiteHub**

#### 2.3.2. Thiết kế bảng Account
Bảng `Account` quản lý tài khoản nội bộ:
- `id` (Int, PK, Auto Increment): định danh tài khoản.
- `name` (String): tên hiển thị.
- `email` (String, Unique): định danh đăng nhập.
- `password` (String): mật khẩu đã mã hóa.
- `avatar` (String, Nullable): ảnh đại diện.
- `role` (Enum: Owner, Employee): vai trò.
- `ownerId` (Int, Nullable): liên kết owner trong mô hình owner-employee.
- `createdAt`, `updatedAt`: thời gian tạo/cập nhật.

**Hình 2.5. Bảng Account**

#### 2.3.3. Thiết kế bảng Dish
Bảng `Dish` quản lý danh mục món:
- `id` (Int, PK).
- `name` (String): tên món.
- `price` (Int): đơn giá.
- `description` (String): mô tả món.
- `image` (String): ảnh món.
- `status` (Enum: Available, Unavailable, Hidden): trạng thái khả dụng.
- `createdAt`, `updatedAt`.

**Hình 2.6. Bảng Dish**

#### 2.3.4. Thiết kế bảng DishSnapshot
Bảng `DishSnapshot` lưu dữ liệu món tại thời điểm tạo order:
- `id` (Int, PK).
- `name`, `price`, `description`, `image`, `status`.
- `dishId` (Int, Nullable): tham chiếu món gốc.
- `createdAt`, `updatedAt`.

Bảng này phục vụ mục tiêu nhất quán lịch sử giao dịch và là thành phần quan trọng trong quá trình tạo hóa đơn.

**Hình 2.7. Bảng DishSnapshot**

#### 2.3.5. Thiết kế bảng Table
Bảng `Table` quản lý thông tin bàn:
- `number` (Int, PK): số hiệu bàn.
- `capacity` (Int): sức chứa.
- `status` (Enum: Available, Reserved, Hidden).
- `token` (String): token phục vụ login Guest theo QR.
- `createdAt`, `updatedAt`.

**Hình 2.8. Bảng Table**

#### 2.3.6. Thiết kế bảng Guest
Bảng `Guest` lưu phiên khách tại bàn:
- `id` (Int, PK).
- `name` (String): tên khách.
- `tableNumber` (Int, Nullable): bàn đang sử dụng.
- `refreshToken` (String, Nullable): token làm mới phiên Guest.
- `refreshTokenExpiresAt` (DateTime, Nullable).
- `createdAt`, `updatedAt`.

**Hình 2.9. Bảng Guest**

#### 2.3.7. Thiết kế bảng Order
Bảng `Order` là thực thể giao dịch trung tâm:
- `id` (Int, PK).
- `guestId` (Int, Nullable): khách đặt món.
- `tableNumber` (Int, Nullable): bàn phục vụ.
- `dishSnapshotId` (Int, Unique): món theo snapshot tại thời điểm đặt.
- `quantity` (Int): số lượng.
- `orderHandlerId` (Int, Nullable): nhân sự xử lý.
- `status` (Enum: Pending, Processing, Rejected, Delivered, Paid, Cancelled).
- `createdAt`, `updatedAt`.

**Hình 2.10. Bảng Order**

#### 2.3.8. Thiết kế bảng RefreshToken
Bảng `RefreshToken` quản lý phiên đăng nhập của tài khoản nội bộ:
- `token` (String, PK).
- `accountId` (Int): tài khoản sở hữu token.
- `expiresAt` (DateTime): hạn token.
- `createdAt` (DateTime).

**Hình 2.11. Bảng RefreshToken**

#### 2.3.9. Thiết kế bảng Socket
Bảng `Socket` ánh xạ kết nối realtime:
- `socketId` (String, PK).
- `accountId` (Int, Nullable, Unique): socket của tài khoản nội bộ.
- `guestId` (Int, Nullable, Unique): socket của khách.

Bảng này giúp server gửi sự kiện đến đúng đối tượng thay vì phát tán toàn cục.

**Hình 2.12. Bảng Socket**

### 2.4. Thiết kế kiến trúc hệ thống

#### 2.4.1. Mô hình tổng thể
Kiến trúc hệ thống gồm ba lớp:
- **Client Layer**: giao diện người dùng (public/guest/manage).
- **Service Layer**: API backend xử lý nghiệp vụ.
- **Data Layer**: PostgreSQL lưu trữ dữ liệu.

**Hình 2.13. Kiến trúc tổng thể hệ thống**

#### 2.4.2. Cấu trúc backend theo module
Backend tổ chức theo route và controller:
- `auth`: đăng nhập, đăng xuất, refresh token, Google login callback.
- `account`: quản lý tài khoản và guest nghiệp vụ.
- `dish`: quản lý món và import Excel món.
- `table`: quản lý bàn và import Excel bàn.
- `order`: tạo/cập nhật/chi tiết/thanh toán/invoice.
- `guest`: đăng nhập guest và thao tác order của guest.
- `indicator`: dữ liệu dashboard.
- `media`, `static`: phục vụ tài nguyên media và file tĩnh.

#### 2.4.3. Cấu trúc frontend theo vùng chức năng
Frontend được tách ba vùng chính:
- **Public**: trang chủ, đăng nhập, thông tin chung.
- **Guest**: menu và danh sách order của khách.
- **Manage**: dashboard, accounts, dishes, tables, orders, setting.

### 2.5. Thiết kế xác thực và phân quyền

#### 2.5.1. Cơ chế JWT
Hệ thống sử dụng Access Token để xác thực request và Refresh Token để cấp lại phiên. Với Guest, hệ thống dùng token riêng theo ngữ cảnh bàn, kết hợp thời hạn phiên để giảm rủi ro truy cập trái phép.

#### 2.5.2. Hook phân quyền backend
- `requireLoginedHook`: bắt buộc token hợp lệ.
- `requireOwnerHook`: giới hạn quyền owner.
- `requireStaffHook`: cho owner và employee.
- `requireGuestHook`: cho guest.

#### 2.5.3. Middleware điều hướng frontend
Middleware kiểm soát truy cập theo route:
- Chặn truy cập private route khi thiếu phiên.
- Tự điều hướng qua luồng refresh token khi access token hết hạn.
- Ngăn chặn truy cập sai vai trò giữa khu vực `/manage` và `/guest`.

### 2.6. Thiết kế luồng realtime

#### 2.6.1. Cơ chế kết nối socket
Mỗi phiên socket được xác thực từ `Authorization` trong handshake. Sau xác thực:
- Tài khoản quản trị/nhân viên được join `ManagerRoom` và phòng riêng `user:{id}`.
- Guest và staff được lưu `socketId` vào CSDL để phục vụ gửi thông báo đích danh.

#### 2.6.2. Danh mục sự kiện realtime
- `new-order`: phát khi đơn mới được tạo.
- `update-order`: phát khi có cập nhật đơn.
- `payment`: phát khi thanh toán thành công.
- `refresh-token`: đồng bộ phiên khi thông tin tài khoản thay đổi.
- `logout`: cưỡng bức đăng xuất khi tài khoản bị xóa.

### 2.7. Thiết kế quy trình nghiệp vụ chi tiết

#### 2.7.1. Quy trình khách gọi món bằng QR
1. Khách quét mã QR gắn với bàn.
2. Hệ thống xác thực `tableNumber + token`.
3. Guest đăng nhập, nhận Access/Refresh Token.
4. Guest chọn món và gửi order.
5. Hệ thống tạo `DishSnapshot` tương ứng từng món và sinh order trạng thái `Pending`.
6. Sự kiện `new-order` phát tới khu vực quản trị.

#### 2.7.2. Quy trình nhân viên xử lý đơn
1. Nhân viên truy cập danh sách order theo thời gian thực.
2. Cập nhật trạng thái đơn theo tiến trình phục vụ.
3. Hệ thống phát `update-order` đến Guest và ManagerRoom.

#### 2.7.3. Quy trình thanh toán và hóa đơn
1. Nhân viên chọn khách cần thanh toán.
2. Hệ thống gom các order chưa thanh toán (`Pending/Processing/Delivered`).
3. Cập nhật đồng loạt trạng thái sang `Paid` trong transaction.
4. Sinh hóa đơn PDF bằng PDFKit và trả URL chứng từ.
5. Phát sự kiện `payment` tới các bên liên quan.

#### 2.7.4. Quy trình thống kê dashboard
1. Chọn khoảng thời gian `fromDate - toDate`.
2. Truy vấn các order trạng thái `Paid`.
3. Tính doanh thu, số đơn, số khách, top món và doanh thu theo ngày.
4. Trả dữ liệu phục vụ hiển thị biểu đồ và thẻ thống kê.

### 2.8. Thiết kế giao diện hệ thống

#### 2.8.1. Giao diện trang chủ
Trang chủ giới thiệu nhà hàng, điều hướng đến khu vực đăng nhập/quản trị, và cung cấp điểm chạm truy cập nhanh cho người dùng.

**Hình 2.14. Giao diện trang chủ hệ thống**

#### 2.8.2. Giao diện khu vực Guest
Khu vực Guest gồm:
- Trang đăng nhập theo bàn.
- Trang menu với khả năng chọn số lượng món.
- Trang theo dõi order theo trạng thái.

**Hình 2.15. Giao diện menu cho Guest**

#### 2.8.3. Giao diện quản trị (Manage)
Khu vực Manage gồm các phân hệ:
- Dashboard tổng quan.
- Quản lý tài khoản.
- Quản lý món ăn.
- Quản lý bàn.
- Quản lý đơn hàng.
- Cài đặt tài khoản.

**Hình 2.16. Giao diện dashboard quản trị**

#### 2.8.4. Giao diện chi tiết đơn hàng và hóa đơn
Trang chi tiết đơn hỗ trợ theo dõi item, người xử lý, trạng thái và thao tác in/tải hóa đơn sau thanh toán.

**Hình 2.17. Giao diện chi tiết đơn hàng**

### 2.9. Kết luận chương
Chương 2 đã mô tả chi tiết tiến trình phân tích và thiết kế hệ thống BiteHub Restaurant, từ mô hình dữ liệu, use-case, kiến trúc, xác thực, realtime đến giao diện người dùng. Các quyết định thiết kế đều hướng tới mục tiêu đảm bảo tính đúng đắn nghiệp vụ, khả năng vận hành thực tế và thuận lợi mở rộng trong tương lai.

---

## CHƯƠNG 3: KẾT QUẢ THỰC HIỆN VÀ ĐÁNH GIÁ

### 3.1. Kết quả hiện thực theo chức năng

#### 3.1.1. Quản lý tài khoản và phân quyền
Hệ thống đã triển khai đầy đủ chức năng đăng nhập/đăng xuất/refresh token cho nhóm tài khoản nội bộ và Guest; phân quyền theo role được kiểm soát ở cả backend và frontend.

#### 3.1.2. Quản lý danh mục món ăn và bàn
Đã triển khai CRUD món ăn, CRUD bàn, kèm khả năng import Excel để tăng hiệu suất cấu hình ban đầu hoặc cập nhật dữ liệu số lượng lớn.

#### 3.1.3. Gọi món theo mã QR
Luồng Guest gọi món theo bàn vận hành ổn định, dữ liệu order phát sinh theo snapshot món, bảo đảm tính chính xác giá trị giao dịch tại thời điểm đặt.

#### 3.1.4. Xử lý đơn realtime
Các cập nhật trạng thái đơn được đồng bộ tức thời giữa khách và khu vực quản trị thông qua Socket.IO, giảm đáng kể độ trễ thông tin nghiệp vụ.

#### 3.1.5. Thanh toán và hóa đơn
Hệ thống hỗ trợ thanh toán tập trung theo khách/bàn và sinh hóa đơn PDF tự động, đáp ứng yêu cầu đối soát cơ bản trong vận hành nhà hàng.

#### 3.1.6. Dashboard phân tích
Dữ liệu dashboard đã đáp ứng các chỉ số cốt lõi: doanh thu theo thời gian, top món bán chạy, số khách, số bàn đang phục vụ.

### 3.2. Đánh giá về chất lượng kỹ thuật

#### 3.2.1. Tính đúng đắn dữ liệu
Việc sử dụng transaction trong các nghiệp vụ quan trọng và cơ chế snapshot cho món ăn giúp hệ thống duy trì độ nhất quán cao, hạn chế sai lệch khi dữ liệu gốc thay đổi.

#### 3.2.2. Tính đáp ứng vận hành
Kiến trúc Fastify kết hợp Socket.IO giúp phản hồi nghiệp vụ nhanh, phù hợp với đặc thù môi trường nhà hàng cần cập nhật tức thời.

#### 3.2.3. Tính mô-đun và bảo trì
Mã nguồn được tổ chức theo module rõ ràng (routes/controllers/schema), thuận lợi cho bảo trì, kiểm thử và mở rộng tính năng.

#### 3.2.4. Khả năng triển khai
Với Docker và docker-compose, hệ thống có thể được đóng gói và triển khai đồng nhất trên nhiều môi trường phát triển/thử nghiệm.

### 3.3. Đối chiếu với mục tiêu ban đầu
So với các mục tiêu đề ra ở phần mở đầu, nhóm thực hiện đã hoàn thành phần lớn các nội dung cốt lõi của một hệ thống quản lý nhà hàng số hóa ở mức đồ án cơ sở nâng cao.

### 3.4. Kết luận chương
Chương 3 cho thấy sản phẩm BiteHub đã đạt được tính hoàn chỉnh chức năng ở mức thực dụng, đáp ứng được chu trình nghiệp vụ chính trong vận hành nhà hàng, đồng thời tạo nền tảng tốt cho các bước phát triển chuyên sâu.

---

## CHƯƠNG 4: KẾT LUẬN VÀ KIẾN NGHỊ

### 4.1. Kết luận
Đề tài **BiteHub Restaurant - Hệ thống quản lý nhà hàng và gọi món bằng mã QR** đã được nhóm thực hiện triển khai thành công theo định hướng số hóa quy trình phục vụ tại bàn. Hệ thống đã hiện thực đầy đủ các chức năng trọng yếu: quản lý dữ liệu vận hành, gọi món QR, xử lý đơn realtime, thanh toán và xuất hóa đơn, thống kê quản trị.

Kết quả đạt được khẳng định tính khả thi của mô hình đối với nhà hàng quy mô nhỏ và vừa, đồng thời thể hiện năng lực áp dụng kiến thức chuyên môn vào một bài toán thực tiễn có tính ứng dụng cao.

### 4.2. Hạn chế của đề tài
Bên cạnh các kết quả đã đạt, hệ thống hiện vẫn còn một số giới hạn:
- Chưa tích hợp thanh toán online qua cổng trung gian.
- Chưa có phân hệ kho/nguyên liệu và định mức cost món.
- Chưa xây dựng đầy đủ bộ kiểm thử tự động nhiều lớp.
- Chưa tích hợp sâu cơ chế giám sát production (metrics/alert/log tập trung).

### 4.3. Kiến nghị và hướng phát triển
Trong giai đoạn tiếp theo, nhóm thực hiện đề xuất các hướng mở rộng:
- Tích hợp cổng thanh toán điện tử và quy trình đối soát tự động.
- Mở rộng quản lý kho, nguyên liệu, cảnh báo tồn và phân tích giá vốn.
- Bổ sung báo cáo nâng cao theo ca làm việc, nhân sự, khu vực bàn.
- Tăng cường bảo mật và quan sát vận hành ở môi trường triển khai thực tế.
- Triển khai chiến lược kiểm thử toàn diện (unit, integration, end-to-end).

### 4.4. Kết luận chương
Chương 4 tổng kết các giá trị đạt được của đồ án, đồng thời chỉ ra những khoảng trống cần hoàn thiện. Các kiến nghị phát triển nêu trên là cơ sở để nâng cấp BiteHub từ mô hình đồ án học thuật lên giải pháp có khả năng thương mại hóa trong tương lai.

---

## TÀI LIỆU THAM KHẢO

1. Fastify Documentation. https://fastify.dev/docs/latest/
2. Prisma Documentation. https://www.prisma.io/docs
3. PostgreSQL Documentation. https://www.postgresql.org/docs/
4. Next.js Documentation. https://nextjs.org/docs
5. React Documentation. https://react.dev/
6. TypeScript Documentation. https://www.typescriptlang.org/docs/
7. Socket.IO Documentation. https://socket.io/docs/v4/
8. JSON Web Token (JWT) Introduction. https://jwt.io/introduction
9. PDFKit Documentation. https://pdfkit.org/docs/
10. Docker Documentation. https://docs.docker.com/
11. TanStack Query Documentation. https://tanstack.com/query/latest
12. Zustand Documentation. https://docs.pmnd.rs/zustand/getting-started/introduction
13. Tailwind CSS Documentation. https://tailwindcss.com/docs
