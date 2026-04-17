# 🚀 Lộ Trình DevOps Chuẩn CV — GoCart (EcommerceWeb) với VPS

> Lời khuyên chân thành từ cộng đồng: **Bạn KHÔNG cần AWS ngay để làm DevOps project hay xin việc.** Dùng **1 con VPS (như Hostinger/Hetzner)** + **Docker** + **CI/CD** đã là một bộ kỹ năng rất mạnh, thực chiến, và kiểm soát chi phí cực dễ.

> **Mục tiêu:** Xây dựng hệ thống CI/CD và triển khai toàn bộ ứng dụng GoCart lên 1 VPS duy nhất, kết hợp Cloudflare cho Frontend. Đảm bảo có đủ từ khóa: `Linux/VPS`, `Docker & Compose`, `GitLab CI/CD`, `Nginx`, `Prometheus & Grafana`. 

---

## 🏗️ 1. Kiến Trúc Hạ Tầng (VPS-Centric)

| Thành phần | Công nghệ sử dụng | Nơi triển khai | Lý do & Ý nghĩa CV |
|---|---|---|---|
| **Frontend** | ReactJS + Vite | **Cloudflare Pages ($0)** | Deploy tĩnh siêu tốc, tự động nhận CI/CD qua Github/GitLab, có sẵn SSL. |
| **Hạ tầng chính (VPS)**| Ubuntu 22.04 LTS | **VPS Hostinger/Hetzner (~$4-$6/tháng)** | Tối thiểu 4GB RAM. Đóng vai trò là Server chạy toàn bộ Backend, DB, Search, Cache. (Keyword: `Linux (Ubuntu)`). |
| **Database & Cache** | MySQL 8, Redis 7, Elasticsearch | **Chạy bằng Docker trên VPS** | Dùng Docker Volume để lưu trữ dữ liệu vĩnh viễn trên ổ cứng VPS. Quản lý tập trung qua `docker-compose`. |
| **CI/CD Pipeline** | GitLab CI + Runner | **GitLab & Cài Runner trên VPS** | Tự động hóa build & deploy. Tận dụng luôn VPS làm Runner để chạy lệnh deploy ngầm. (Keyword: `GitLab CI/CD`, `Gitlab Runner`). |
| **Image Registry** | Docker Hub / GitLab Registry| **$0** | Lưu trữ Docker Image sau khi Build (chờ pull xuống VPS). |
| **Web Server / Proxy** | Nginx + Certbot | **Cài trực tiếp ở VPS** | Reverse proxy nhận request từ Domain cho Backend, cấp phát tự động HTTPS. (Keyword: `Nginx`). |
| **Monitoring** | Prometheus + Grafana | **Chạy bằng Docker trên VPS** | Giám sát tài nguyên VPS và app Springboot, gửi Alert Telegram. (Keyword: `Prometheus, Grafana`). |
| **Domain** | Đã mua | **Trỏ qua Cloudflare DNS** | Route traffic mượt mà giữa Frontend và API. |

---

## 🗓️ 2. Lộ Trình Triển Khai Thực Chiến (10-12 Ngày)

### 🟢 Giai Đoạn 1: Hoàn thiện Local Container (Ngày 1-2)
*Mục tiêu: App chạy mượt 100% bằng Docker ở máy cá nhân.*
* **Checklist:**
    * [x] Code Frontend & Backend đã chuẩn.
    * [x] File `docker-compose.yml` local đã chạy tốt (Springboot, MySQL, Elasticsearch, Redis). 
    * [ ] Tách `docker-compose.prod.yml` riêng cho Production (Có thể gom luôn Monitoring vào đây chờ sẵn).
    * [ ] Thiết lập storage persistence (Docker Volumes) cho MySQL và Elasticsearch trong cấu trúc compose để không mất dữ liệu.

### 🟡 Giai Đoạn 2: Xây Dựng Căn Cứ Linux VPS (Ngày 3-4)
*Mục tiêu: VPS lên sóng, cài cắm đầy đủ vũ khí, sẵn sàng nhận Code.*
* **Checklist:**
    * [ ] Thuê VPS (Hostinger, Vultr hoặc Hetzner), chọn hệ điều hành Ubuntu 22.04. Cần cấu hình ≥ 4GB RAM + 50GB SSD.
    * [ ] Cấu hình bảo mật cơ bản: Đăng nhập bằng SSH Key (tắt login bằng Password), thiết lập tường lửa (`ufw` chỉ mở port 22, 80, 443).
    * [ ] Cài đặt nền tảng: Docker, Docker Compose, Git.
    * [ ] Tạo thư mục deploy trên VPS (VD: `/opt/gocart`), copy file `docker-compose.prod.yml` và file `.env` chứa mật khẩu production lên đây.

### 🟠 Giai Đoạn 3: Cloudflare Pages & Web Frontend (Ngày 5-6)
*Mục tiêu: Đưa diện mạo web lên mây đầu tiên bằng đồ free.*
* **Checklist:**
    * [ ] Trỏ tên miền bạn đã mua vào Nameserver của Cloudflare.
    * [ ] Kết nối kho code Frontend với **Cloudflare Pages**.
    * [ ] Thiết lập auto-deploy: Mọi commit push lên nhánh `main` ở thư mục frontend -> Cloudflare tự build `npm run build` và public URL.
    * [ ] Thêm biến `VITE_API_URL` vào Cloudflare trỏ về domain API tương lai (VD: `https://api.yourdomain.com`).

### 🔵 Giai Đoạn 4: Setup GitLab CI/CD Vững Chắc (Ngày 7-9)
*Mục tiêu: Không bao giờ SSH lên VPS gõ lệnh deploy thủ công nữa.*
* **Checklist:**
    * [ ] (Lựa chọn 1) Tạo Repo Backend trên GitLab.
    * [ ] (Lựa chọn 2) Nếu vẫn muốn dùng GitHub, ta có thể dùng GitHub Actions. Tuy nhiên nếu CV muốn có Gitlab CI -> đưa logic Backend lên GitLab.
    * [ ] Cài đặt phần mềm **GitLab Runner** trực tiếp trên chính VPS Hostinger của bạn dưới dạng `shell` hoặc `docker` executor.
    * [ ] Viết file `.gitlab-ci.yml`. Luồng sẽ như sau:
        1. **Build Stage:** Maven build `.jar`, đóng gói thành Docker Image.
        2. **Push Stage:** Đẩy Docker Image lên DockerHub.
        3. **Deploy Stage:** GitLab Runner đang chạy trên VPS chỉ việc gõ `cd /opt/gocart && docker compose pull && docker compose up -d`. Siêu nhanh và 0 thời gian trễ mạng.

### 🟣 Giai Đoạn 5: Web Server Nginx & Domain Backend (Ngày 10-11)
*Mục tiêu: Backend có SSL và kết nối bảo mật với Frontend.*
* **Checklist:**
    * [ ] Trỏ 1 bản ghi subdomain (như `api.yourdomain.com`) từ Cloudflare về địa chỉ IP của VPS Hostinger.
    * [ ] Cài đặt Nginx trực tiếp lên VPS (chạy song song với Docker container).
    * [ ] Viết Nginx Config: Dẫn luồng traffic từ port 80/443 vào port Spring Boot (8088).
    * [ ] Dùng công cụ `Certbot` xin chứng chỉ SSL let's encrypt để có "ổ khóa xanh" HTTPS cho Backend. Chỉ khi Backend có HTTPS thì Frontend (Cloudflare) mới gọi API được.

### ⚫ Giai Đoạn 6: Giám sát Monitoring & Backup (Ngày 12)
*Mục tiêu: Khớp hoàn hảo tiêu chí "Vận hành (Operations)" trong chữ DevOps.*
* **Checklist:**
    * [ ] Thêm Prometheus và Grafana container vào chính `docker-compose.prod.yml` trên VPS.
    * [ ] Trỏ Prometheus hứng data của Spring Boot Actuator và cào sức khỏe của VPS (Cài thêm `Node_Exporter`).
    * [ ] Cài Bot gửi Alert Telegram (khi VPS hết dung lượng, RAM đầy 90%).
    * [ ] Tùy chọn cực hay cho CV CV: Viết 1 file bash script nhỏ dùng Cronjob trên VPS để mỗi đêm tự động dump data MySQL lưu thành file nén zip, đẩy sang một chỗ nào khác nếu cần.

---

## 🛠️ Lời khuyên khi phỏng vấn với kiến trúc này

Khi HR hay Tech Lead hỏi "Tại sao không dùng AWS?", hãy tự tin trả lời:
> *"Với dự án cá nhân, em đề cao tính hiệu quả chi phí (Cost optimization) và sự chủ động kiếm soát cấu hình cấp thấp (Linux administration). Kiến trúc sử dụng **Bare-metal/VPS với Docker** giúp em hiểu rất sâu về Networking, Nginx, Linux File System thay vì để managed service của Cloud che giấu hết. Luồng **GitLab CI/CD Runner** em thiết lập giải quyết xuất sắc bài toán CI/CD. Đương nhiên nếu vào công ty sử dụng EC2/EKS thì những kỹ năng Linux/Docker cốt lõi này của em hoàn toàn map sang được 100%."*
