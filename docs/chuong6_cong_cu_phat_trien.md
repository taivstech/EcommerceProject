# CHƯƠNG 6: LỰA CHỌN CÔNG CỤ PHÁT TRIỂN HỆ THỐNG

## 6.1. Giới thiệu các công nghệ sử dụng

### 6.1.1. Backend – Java Spring Boot 3.2.3

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Ngôn ngữ lập trình | Java | 21 (LTS) |
| Framework chính | Spring Boot | 3.2.3 |
| Bảo mật | Spring Security + OAuth2 | 6.x |
| ORM / Persistence | Spring Data JPA + Hibernate | 6.x |
| Database migrations | Flyway | 10.x |
| Ánh xạ đối tượng | MapStruct | 1.5.5 |
| Giảm boilerplate code | Lombok | 1.18.30 |
| WebSocket (chat realtime) | Spring WebSocket + STOMP | 3.2.3 |
| Monitoring / Metrics | Spring Actuator + Micrometer Prometheus | 3.2.3 |
| Email | Spring Mail (SMTP) | 3.2.3 |
| Excel export | Apache POI | 5.2.5 |

### 6.1.2. Frontend – React 19 (TypeScript + Vite)

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| UI Framework | React | 19.2.1 |
| Ngôn ngữ | TypeScript | 5.9.3 |
| Build tool | Vite | 6.3.0 |
| Styling | TailwindCSS | 4.x |
| State management | Redux Toolkit | 2.8.2 |
| Routing | React Router DOM | 7.5.0 |
| Biểu đồ thống kê | Recharts | 3.1.2 |
| Icon | Lucide React | 0.525.0 |
| Toast notification | React Hot Toast | 2.5.2 |
| SEO | React Helmet Async | 3.0.0 |

### 6.1.3. Cơ sở dữ liệu

| Loại | Công nghệ | Mục đích |
|---|---|---|
| RDBMS chính | MySQL 8.0 | Lưu trữ toàn bộ dữ liệu nghiệp vụ |
| Cache / Session | Redis (Jedis) | Cache token, giỏ hàng, session, rate-limit |
| Full-text Search | Elasticsearch | Tìm kiếm sản phẩm theo từ khóa, lọc nhanh |

### 6.1.4. Cổng thanh toán

| Cổng | Mô tả |
|---|---|
| **VNPAY** | Thanh toán nội địa qua ATM/QR/Internet Banking |
| **MoMo** | Ví điện tử phổ biến tại Việt Nam |
| **PayPal** | Thanh toán quốc tế (PayPal Server SDK 2.2.0) |
| **COD** | Thanh toán khi nhận hàng (Cash On Delivery) |

### 6.1.5. Đơn vị vận chuyển

| Đơn vị | Mô tả |
|---|---|
| **Giao Hàng Nhanh (GHN)** | Tích hợp API tra cứu địa chỉ (tỉnh/huyện/phường), tính phí ship, tạo vận đơn, theo dõi trạng thái giao hàng |

### 6.1.6. Lưu trữ tài nguyên – CDN

| Dịch vụ | Mục đích |
|---|---|
| **ImageKit CDN** | Upload và phân phối ảnh sản phẩm, ảnh shop, avatar người dùng với tốc độ cao |

### 6.1.7. Công cụ hỗ trợ

| Công cụ | Mục đích |
|---|---|
| **Docker + Docker Compose** | Container hóa toàn bộ hệ thống (backend, frontend, MySQL, Redis, Elasticsearch, Prometheus, Grafana) |
| **Git + GitHub** | Quản lý source code, CI/CD |
| **Postman** | Test API (kèm file `EcommerceWeb.postman_collection.json`) |
| **Prometheus + Grafana** | Thu thập metrics, monitoring hiệu năng hệ thống |
| **Figma** | Thiết kế giao diện wireframe/mockup |
| **IntelliJ IDEA** | IDE phát triển backend |
| **VS Code** | IDE phát triển frontend |

---

## 6.2. Lý do lựa chọn và sự phù hợp

### 6.2.1. Java Spring Boot – Backend

- **Bảo mật cao:** Spring Security cung cấp xác thực JWT, OAuth2 (Google login), phân quyền RBAC theo vai trò Admin / Seller / Buyer / Warehouse Employee.
- **Hiệu năng:** Hỗ trợ Optimistic Locking (trường `version`) để tránh race condition khi nhiều người đặt hàng cùng lúc; tích hợp Redis cache giảm tải CSDL.
- **Hệ sinh thái phong phú:** Spring Data JPA tự động sinh query, Flyway quản lý migration CSDL, Actuator + Prometheus/Grafana giám sát hệ thống.
- **WebSocket:** Spring WebSocket + STOMP hỗ trợ chat realtime giữa khách hàng và shop.
- **Phù hợp quy mô:** Spring Boot phù hợp từ prototype đến hệ thống production quy mô lớn; cộng đồng lớn, tài liệu đầy đủ, dễ tìm kiếm hỗ trợ.

### 6.2.2. React 19 + TypeScript + Vite – Frontend

- **React:** Component-based architecture giúp tái sử dụng UI, cộng đồng lớn nhất trong hệ sinh thái frontend hiện nay.
- **TypeScript:** Kiểm tra kiểu tĩnh tại compile-time, giảm lỗi runtime, tăng khả năng bảo trì code dài hạn.
- **Vite:** Build tool thế hệ mới với Hot Module Replacement (HMR) cực nhanh, tối ưu bundle output cho production.
- **Redux Toolkit:** Quản lý state toàn cục (auth, cart, notification) gọn gàng, ít boilerplate.
- **TailwindCSS 4:** Utility-first CSS giúp xây dựng giao diện responsive nhanh chóng và nhất quán.

### 6.2.3. MySQL 8.0 – Cơ sở dữ liệu chính

- **Quan hệ phức tạp:** Dữ liệu TMĐT có nhiều quan hệ (User → Order → OrderItem → ProductVariant → WarehouseStock); MySQL với InnoDB engine hỗ trợ ACID transaction đầy đủ.
- **Flyway migration:** Quản lý version schema, đảm bảo an toàn khi deploy lên môi trường production.
- **Chi phí thấp:** Miễn phí (GPL), phổ biến, dễ dàng triển khai trên cloud (AWS RDS, Google Cloud SQL).

### 6.2.4. Redis – Cache & Token Store

- **Tốc độ cao:** Dữ liệu lưu trong RAM, thời gian truy cập dưới 1ms.
- **JWT token management:** Lưu refresh token an toàn, hỗ trợ thu hồi token ngay khi người dùng logout.
- **Rate limiting:** Giới hạn số lần gọi API để chống spam và tấn công brute-force.
- **API cache:** Cache kết quả tính phí ship từ GHN, tránh gọi API bên ngoài lặp lại nhiều lần.

### 6.2.5. Elasticsearch – Tìm kiếm sản phẩm

- **Full-text search mạnh mẽ:** Hỗ trợ fuzzy matching (chịu lỗi chính tả), tách từ tiếng Việt.
- **Hiệu năng vượt trội:** MySQL `LIKE` query chạy chậm khi có hàng triệu bản ghi; Elasticsearch dùng inverted index cho kết quả tức thì.
- **Bộ lọc linh hoạt:** Kết hợp full-text + filter theo giá, danh mục, đánh giá sao trong một query duy nhất.

### 6.2.6. Docker + Docker Compose

- **Môi trường nhất quán:** Đảm bảo toàn bộ thành viên nhóm chạy cùng môi trường, loại bỏ tình trạng "chạy được trên máy tôi".
- **Triển khai nhanh:** `docker compose up -d` khởi động toàn bộ 7 service chỉ bằng 1 lệnh.
- **Isolation:** Các service độc lập trong container riêng; lỗi một service không ảnh hưởng đến service khác.

---

## 6.3. Kiến trúc tổng thể dự kiến

### 6.3.1. Sơ đồ kiến trúc hệ thống

```
+----------------------------------------------------------------------+
|                          CLIENT LAYER                                 |
|                                                                        |
|   React 19 + TypeScript + Vite  (GoCart - Single Page Application)   |
|   Redux Toolkit | React Router 7 | TailwindCSS 4 | Recharts           |
+--------------------------------------+-------------------------------+
                                       |
                     HTTPS / REST API / WebSocket (STOMP)
                                       |
+--------------------------------------v-------------------------------+
|                         SERVER LAYER                                  |
|                                                                        |
|             Java Spring Boot 3.2.3  (Port: 8080)                     |
|                                                                        |
|  +-------------------+  +-------------------+  +------------------+  |
|  | REST Controllers  |  | WebSocket / STOMP |  | Spring Security  |  |
|  | (API Endpoints)   |  | (Realtime Chat)   |  | JWT + OAuth2     |  |
|  +---------+---------+  +---------+---------+  +------------------+  |
|            |                      |                                    |
|  +---------v----------------------v------------------------------+    |
|  |            Service Layer  (Business Logic)                    |    |
|  |  OrderService | ProductService | PaymentService | SearchSvc  |    |
|  +------------------------------+---------------------------------+    |
|                                 |                                      |
|  +--------------+  +-----------+  +--------------+  +------------+   |
|  | Spring Data  |  | Flyway DB |  | Actuator +   |  | MapStruct  |   |
|  | JPA/Hibernate|  | Migration |  | Prometheus   |  | Lombok     |   |
|  +------+-------+  +-----------+  +--------------+  +------------+   |
+---------+-----------------------------------------------------------+
          |
+---------v-----------------------------------------------------------+
|                         DATA LAYER                                   |
|  +-----------------+  +------------------+  +--------------------+  |
|  |   MySQL 8.0     |  |     Redis        |  |   Elasticsearch    |  |
|  |  (Primary DB)   |  |  (Cache/Token)   |  |  (Product Search)  |  |
|  |   18+ tables    |  |   Jedis client   |  |  Spring Data ES    |  |
|  +-----------------+  +------------------+  +--------------------+  |
+---------------------------------------------------------------------+
          |
+---------v-----------------------------------------------------------+
|                    THIRD-PARTY SERVICES                              |
|  +--------+  +-------+  +---------+  +-------+  +-------------+    |
|  | VNPAY  |  | MoMo  |  | PayPal  |  |  GHN  |  |  ImageKit   |    |
|  |(Payment|  |(Pay.) |  | (Pay.)  |  |(Ship.)|  | (CDN/Image) |    |
|  +--------+  +-------+  +---------+  +-------+  +-------------+    |
|  +------------------------+  +----------------------------------+    |
|  | Google OAuth2          |  | SMTP Email  (Spring Mail)        |    |
|  | (Social Login)         |  | OTP, thong bao don hang          |    |
|  +------------------------+  +----------------------------------+    |
+---------------------------------------------------------------------+
          |
+---------v-----------------------------------------------------------+
|                         MONITORING                                   |
|     Prometheus  (thu thap metrics)  -->  Grafana  (dashboard)       |
+---------------------------------------------------------------------+
```

### 6.3.2. Luồng giao tiếp chính

| Luồng | Giao thức | Mô tả |
|---|---|---|
| Frontend ↔ Backend | HTTPS / REST API (JSON) | Toàn bộ nghiệp vụ: sản phẩm, đơn hàng, xác thực... |
| Frontend ↔ Backend Chat | WebSocket (STOMP over SockJS) | Chat realtime giữa khách hàng và shop |
| Backend ↔ MySQL | JDBC (qua JPA/Hibernate) | Đọc/ghi dữ liệu nghiệp vụ có transaction ACID |
| Backend ↔ Redis | Redis Protocol (Jedis) | Cache, JWT token store, rate limiting |
| Backend ↔ Elasticsearch | REST API (Spring Data ES) | Index và tìm kiếm sản phẩm |
| Backend ↔ VNPAY/MoMo | HTTPS | Tạo URL thanh toán, nhận IPN callback |
| Backend ↔ PayPal | HTTPS (PayPal SDK v2) | Tạo order PayPal, capture payment |
| Backend ↔ GHN | HTTPS (REST API) | Tra địa chỉ, tính phí ship, tạo vận đơn |
| Backend ↔ ImageKit | HTTPS (REST API) | Upload ảnh, lấy URL CDN |
| Backend ↔ Google | HTTPS (OAuth2 Authorization Code) | Xác thực đăng nhập bằng tài khoản Google |
| Backend → Prometheus | HTTP `/actuator/prometheus` | Expose metrics hệ thống |

### 6.3.3. Triển khai với Docker Compose

Toàn bộ hệ thống được container hóa và quản lý bởi Docker Compose:

| Service | Image / Base | Port |
|---|---|---|
| `backend` | openjdk:21 (custom build) | 8080 |
| `frontend` | node:20 / nginx | 80 |
| `mysql` | mysql:8.0 | 3306 |
| `redis` | redis:7-alpine | 6379 |
| `elasticsearch` | elasticsearch:8.x | 9200 |
| `prometheus` | prom/prometheus | 9090 |
| `grafana` | grafana/grafana | 3000 |

Khởi động toàn bộ hệ thống:

```bash
docker compose up -d
```

---

> **Kết luận:** Bộ công nghệ được lựa chọn dựa trên các tiêu chí: **hiệu năng cao** (Redis cache, Elasticsearch full-text search), **bảo mật tốt** (JWT, OAuth2, BCrypt, Optimistic Locking), **dễ triển khai** (Docker Compose), **chi phí thấp** (toàn bộ open-source) và **phù hợp với nhóm sinh viên** (cộng đồng lớn, tài liệu phong phú). Kiến trúc Monolith với chuẩn REST API + WebSocket đủ đáp ứng quy mô bài tập lớn, đồng thời có thể mở rộng lên Microservices khi cần thiết trong tương lai.
