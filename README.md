# BiteHub - Nền tảng dịch vụ theo mô hình Gig Economy

BiteHub là đồ án xây dựng website trung gian kết nối **người mua dịch vụ (Buyer)** và **người bán dịch vụ (Seller/Freelancer)** theo mô hình Gig Economy.

Mục tiêu của hệ thống là số hóa toàn bộ quy trình từ tìm kiếm dịch vụ, đặt hàng, thanh toán, đánh giá đến quản trị vận hành, giúp giao dịch minh bạch và dễ theo dõi hơn.

## 1. Mục tiêu đồ án

- Xây dựng nền tảng kết nối freelancer và khách hàng trên web.
- Chuẩn hóa quy trình nghiệp vụ: đăng dịch vụ -> đặt dịch vụ -> thanh toán -> đánh giá.
- Hỗ trợ quản trị và kiểm soát rủi ro thông qua báo cáo vi phạm, nhật ký quản trị.

## 2. Chức năng chính

- Quản lý tài khoản và xác thực người dùng.
- Quản lý dịch vụ (gig): tạo, chỉnh sửa, hiển thị, lưu dịch vụ.
- Tìm kiếm và lọc dịch vụ theo nhiều tiêu chí.
- Giỏ hàng, đơn hàng, theo dõi trạng thái xử lý.
- Thanh toán trực tuyến qua cổng thanh toán (theo báo cáo: VNPAY).
- Đánh giá/bình luận và phản hồi sau giao dịch.
- Báo cáo vi phạm, khiếu nại và xử lý ở phía quản trị.
- Bảng quản trị (Admin Panel) để quản lý người dùng, dịch vụ, đơn hàng và nội dung hệ thống.

## 3. Kiến trúc hệ thống

Dự án được tách thành 2 phần chính:

- `client`: Frontend Next.js (React + TypeScript + Tailwind CSS).
- `server`: Backend Fastify (TypeScript) + Prisma ORM.

Ngoài ra hệ thống có hỗ trợ realtime qua Socket.IO cho các tình huống cần giao tiếp thời gian thực.

## 4. Công nghệ sử dụng

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind CSS`
- Backend: `Fastify`, `Node.js`, `TypeScript`
- ORM/Database: `Prisma` (mô hình dữ liệu theo thiết kế ERD của đồ án)
- Realtime: `Socket.IO`
- Validation: `Zod`
- Các công cụ khác: `ESLint`, `Prettier`

## 5. Mô hình vai trò

- `Buyer`: Tìm kiếm, đặt dịch vụ, thanh toán, đánh giá, khiếu nại.
- `Seller`: Tạo và quản lý gig, nhận đơn, trao đổi và hoàn thành dịch vụ.
- `Admin`: Giám sát hoạt động, xử lý vi phạm, quản trị dữ liệu hệ thống.

## 6. Hướng dẫn chạy dự án

### Yêu cầu môi trường

- Node.js >= 18
- npm

### Cài đặt

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### Chạy frontend

```bash
cd client
npm run dev
```

### Chạy backend

```bash
cd server
npm run dev
```

### Build production

```bash
cd client && npm run build
cd ../server && npm run build
```

## 7. Giá trị học thuật và thực tiễn

- Áp dụng mô hình Gig Economy vào bối cảnh thị trường Việt Nam.
- Thiết kế dữ liệu tương đối đầy đủ cho một nền tảng dịch vụ số.
- Kết hợp kiến thức fullstack: UI/UX, API, dữ liệu, bảo mật, thanh toán, quản trị.

## 8. Hướng phát triển

- Mở rộng thêm cổng thanh toán quốc tế (PayPal/Stripe).
- Tối ưu hiệu năng và khả năng mở rộng khi số lượng người dùng tăng.
- Cải thiện UI/UX và tăng cường phân tích dữ liệu hành vi người dùng.

## 9. Tác giả

Nhóm thực hiện đồ án ngành Công nghệ Thông tin - chuyên ngành Công nghệ Phần mềm.

---

Nếu bạn muốn, mình có thể viết thêm bản `README` học thuật hơn theo format báo cáo (Mở đầu - Cơ sở lý thuyết - Phân tích thiết kế - Kết quả - Kết luận) để nộp kèm hội đồng.
