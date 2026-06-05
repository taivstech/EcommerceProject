# Hướng dẫn Cài đặt và Chạy Ứng dụng trên Máy mới

Tài liệu này hướng dẫn cách thiết lập cơ sở dữ liệu và khởi chạy toàn bộ hệ thống Ecommerce trên một máy tính mới.

---

## I. Yêu cầu Hệ thống (Prerequisites)

Trước khi bắt đầu, máy tính cần cài đặt sẵn các công cụ sau:
1. **Java JDK 21** (Dành cho Spring Boot Backend)
2. **Node.js** (Phiên bản LTS 18 hoặc 20, dành cho Frontend & Mobile)
3. **Docker & Docker Desktop** (Để chạy các dịch vụ bổ trợ)
4. **MySQL Server** (Cài đặt cục bộ trên máy host, chạy cổng mặc định `3306`)

---

## II. Các Bước Thiết Lập

### 1. Khôi phục Cơ sở Dữ liệu (Import Database)
1. Mở MySQL Client của bạn (DBeaver, MySQL Workbench, Command Line, v.v.).
2. Tạo một Database mới tên là `ecommerce_db` với bộ mã UTF-8:
   ```sql
   CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import file database backup (`.sql`) được gửi kèm vào database `ecommerce_db` vừa tạo.

### 2. Thiết lập Biến Môi trường (`.env`)
* Sao chép file `.env` được gửi kèm vào thư mục gốc của dự án (cùng cấp với file `README_SETUP.md` này).
* Mở file `.env` và kiểm tra/chỉnh sửa các thông số cấu hình cho đúng với máy của bạn (ví dụ: `MYSQL_PASSWORD` khớp với mật khẩu MySQL trên máy của bạn).

---

## III. Khởi Chạy Ứng Dụng

Hệ thống được chia làm 2 phần: **Các dịch vụ hạ tầng chạy bằng Docker** và **Các ứng dụng chạy trực tiếp bằng Code (Local)**.

### Bước 1: Khởi chạy các dịch vụ Docker (Chỉ chạy Redis, Elasticsearch, Recommendation)
Dự án sử dụng Docker Compose để chạy các dịch vụ nền. Mở Terminal tại thư mục gốc của dự án và chạy lệnh sau để **chỉ bật** container của Redis, Elasticsearch và Recommendation Service:

```bash
docker-compose up -d redis elasticsearch recommendation
```

> **Lưu ý:**
> * Bạn **không cần** chạy toàn bộ các dịch vụ trong Docker Compose (như backend hay frontend) để tránh xung đột cổng và giúp dễ dàng debug code trực tiếp trên máy host.
> * Lệnh trên sẽ tự động bỏ qua các container `backend` và `frontend` trong file `docker-compose.yml`.

### Bước 2: Chạy Backend (Spring Boot)
1. Mở một Terminal mới và di chuyển vào thư mục backend:
   ```bash
   cd backend/EcommerceWeb
   ```
2. Chạy ứng dụng (sử dụng Maven wrapper có sẵn):
   * **Trên Windows (PowerShell/CMD):**
     ```powershell
     .\mvnw spring-boot:run
     ```
   * **Trên macOS/Linux:**
     ```bash
     chmod +x mvnw
     ./mvnw spring-boot:run
     ```
   * *Backend sẽ chạy tại cổng `8088`.*

### Bước 3: Chạy Frontend (React + Vite)
1. Mở một Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện (chỉ thực hiện ở lần đầu tiên):
   ```bash
   npm install
   ```
3. Chạy ứng dụng ở chế độ Development:
   ```bash
   npm run dev
   ```
   * *Truy cập ứng dụng web tại địa chỉ hiển thị trên terminal (thường là `http://localhost:3000` hoặc `http://localhost:5173`).*

### Bước 4: Chạy Mobile App (React Native Expo)
1. Mở một Terminal mới và di chuyển vào thư mục mobile:
   ```bash
   cd mobile
   ```
2. Cài đặt các thư viện (chỉ thực hiện ở lần đầu tiên):
   ```bash
   npm install
   ```
3. Chạy ứng dụng Expo:
   ```bash
   npx expo start
   ```
4. Sử dụng ứng dụng Expo Go trên điện thoại để quét mã QR hiển thị trên Terminal để trải nghiệm ứng dụng trên điện thoại di động (hoặc nhấn `a` để chạy trên máy ảo Android, `i` để chạy trên máy ảo iOS).
