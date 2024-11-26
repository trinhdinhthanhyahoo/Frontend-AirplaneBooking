# AIRBOOK – Hệ thống tìm kiếm và đặt vé máy bay

## Mô tả
Hệ thống cung cấp thông tin cơ bản của các chuyến bay về hãng bay, giá vé, địa điểm xuất phát và địa điểm tới. Cung cấp các tính năng cốt lõi như tìm kiếm và đặt vé, sử dụng dịch vụ cảng hàng không.

## Công nghệ sử dụng

### Backend
- **Ngôn ngữ**: Java
- **Framework**: Spring Boot
- **Cấu trúc**: Mô hình phân lớp MVC
  - Client request
  - Controller
  - Service
  - Repository
  - Entity
  - Response DTO
  - Client response

### Frontend
- **Ngôn ngữ**: HTML, CSS, Javascript
- **Framework**: Vanilla Javascript (không sử dụng Framework)
- **Cấu trúc**: 
  - Pages (*.html)
  - JS
  - CSS
  - Images

## Hướng dẫn cài đặt

### Backend

1. **Cài đặt Maven**
   - Tải Maven từ: [maven.apache.org/download.cgi](https://maven.apache.org/download.cgi)
   - Thiết lập biến môi trường `MAVEN_HOME` và `PATH`

2. **Clone dự án**
   ```bash
   git clone https://github.com/trinhdinhthanhyahoo/Backend-AirplaneBooking.git
   ```

3. **Cài đặt dự án**
   ```bash
   cd Backend-AirplaneBooking
   mvn clean install
   ```

4. **Cấu hình Database**
   - Import file `dump-airplanebooking-11262024.sql` vào pgAdmin
   - Tạo kết nối JDBC với database `airplane_booking` trong DBeaver
   - Cấu hình lại JDBC trong `application.properties`

5. **Chạy dự án**
   - Cách 1: Chạy qua Visual Studio Code với file `AirplaneBookingApplication.java`
   - Cách 2: Chạy qua Command Prompt
     ```bash
     mvn spring-boot:run
     ```

### Frontend

1. **Clone dự án**
   ```bash
   git clone https://github.com/trinhdinhthanhyahoo/Frontend-AirplaneBooking.git
   ```

2. **Chạy dự án**
   - Sử dụng Live Server để chạy project

## API Documentation

### Authentication
- `POST /api/auth/login` - Đăng nhập người dùng

### Users
- `POST /api/users` - Tạo người dùng mới
- `GET /api/users/{id}` - Lấy thông tin người dùng theo ID
- `GET /api/users` - Lấy danh sách người dùng
- `PUT /api/users/{id}` - Cập nhật thông tin người dùng
- `DELETE /api/users/{id}` - Xóa người dùng

### Flights
- `POST /api/flights` - Tạo chuyến bay mới
- `GET /api/flights/{id}` - Lấy thông tin chuyến bay theo ID
- `GET /api/flights` - Lấy danh sách chuyến bay
- `PUT /api/flights/{id}` - Cập nhật thông tin chuyến bay
- `DELETE /api/flights/{id}` - Xóa chuyến bay
- `GET /api/flights/{id}/available-seats` - Lấy số ghế còn trống
- `PATCH /api/flights/{id}/status` - Cập nhật trạng thái chuyến bay
- `GET /api/flights/status/{status}` - Lấy danh sách chuyến bay theo trạng thái

### Bookings
- `POST /api/bookings` - Tạo đặt chỗ mới
- `GET /api/bookings/{id}` - Lấy thông tin đặt chỗ theo ID
- `GET /api/bookings` - Lấy danh sách đặt chỗ
- `PUT /api/bookings/{id}` - Cập nhật thông tin đặt chỗ
- `DELETE /api/bookings/{id}` - Xóa đặt chỗ
- `GET /api/bookings/user/{userId}` - Lấy danh sách đặt chỗ theo người dùng
- `PATCH /api/bookings/{id}/status` - Cập nhật trạng thái đặt chỗ
- `GET /api/bookings/reference/{bookingReference}` - Lấy đặt chỗ theo mã tham chiếu

### Airports
- `POST /api/airports` - Tạo sân bay mới
- `GET /api/airports/{id}` - Lấy thông tin sân bay theo ID
- `GET /api/airports` - Lấy danh sách sân bay
- `PUT /api/airports/{id}` - Cập nhật thông tin sân bay
- `DELETE /api/airports/{id}` - Xóa sân bay
- `GET /api/airports/code/{airportCode}` - Lấy sân bay theo mã
- `GET /api/airports/city/{city}` - Lấy danh sách sân bay theo thành phố
- `GET /api/airports/country/{country}` - Lấy danh sách sân bay theo quốc gia

### Airlines
- `POST /api/airlines` - Tạo hãng hàng không mới
- `GET /api/airlines/{id}` - Lấy thông tin hãng hàng không theo ID
- `GET /api/airlines` - Lấy danh sách hãng hàng không
- `PUT /api/airlines/{id}` - Cập nhật thông tin hãng hàng không
- `DELETE /api/airlines/{id}` - Xóa hãng hàng không
- `GET /api/airlines/code/{airlineCode}` - Lấy hãng hàng không theo mã

### Payments
- `POST /api/payments` - Tạo thanh toán mới
- `GET /api/payments/{id}` - Lấy thông tin thanh toán theo ID
- `GET /api/payments/booking/{bookingId}` - Lấy danh sách thanh toán theo đặt chỗ
- `GET /api/payments/transaction/{transactionCode}` - Lấy thanh toán theo mã giao dịch
- `PUT /api/payments/{id}` - Cập nhật thông tin thanh toán
- `DELETE /api/payments/{id}` - Xóa thanh toán

### Payment Methods
- `POST /api/payment-methods` - Tạo phương thức thanh toán mới
- `GET /api/payment-methods/{id}` - Lấy thông tin phương thức thanh toán
- `GET /api/payment-methods/active` - Lấy danh sách phương thức thanh toán đang hoạt động
- `PUT /api/payment-methods/{id}` - Cập nhật phương thức thanh toán
- `DELETE /api/payment-methods/{id}` - Xóa phương thức thanh toán

### Seats
- `POST /api/seats` - Tạo ghế mới
- `GET /api/seats/{id}` - Lấy thông tin ghế theo ID
- `GET /api/seats/flight/{flightId}` - Lấy danh sách ghế theo chuyến bay
- `GET /api/seats/flight/{flightId}/available` - Lấy danh sách ghế còn trống
- `PUT /api/seats/{id}` - Cập nhật thông tin ghế
- `DELETE /api/seats/{id}` - Xóa ghế

## Tác giả

**Sinh viên thực hiện:**
- Họ và tên: Trịnh Đình Thành
- MSSV: 2251120247
- Lớp: CN22E
- Email: 
  - 2251120247@ut.edu.vn
  - trinhdinhthanhyahoo@gmail.com
- Trường: Đại học Giao thông Vận tải TP.HCM
- Khoa: Công nghệ thông tin

**Giảng viên hướng dẫn:**
- Thầy Trương Quang Tuấn

## Liên hệ
Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ:
- Email: trinhdinhthanhyahoo@gmail.com
- GitHub: [trinhdinhthanhyahoo](https://github.com/trinhdinhthanhyahoo)




