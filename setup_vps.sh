#!/bin/bash
# ==============================================================================
# GoCart — VPS Initial Setup Script
# Run ONCE on a fresh Ubuntu 22.04 VPS (as root or sudo user)
#
# Architecture: User → Internet → CDN → UFW Firewall → Nginx → Backend → Cache → DB
# ==============================================================================

set -e
echo "======================================================"
echo " GoCart VPS Setup — Firewall + Nginx + Certbot"
echo "======================================================"

# ── Cấu hình (thay đổi cho phù hợp) ─────────────────────────────────────────
DOMAIN="api.ecommerce.pro.vn"
EMAIL="admin@ecommerce.pro.vn"
PROJECT_DIR="/opt/gocart"
NGINX_CONF="/etc/nginx/sites-available/gocart"
NGINX_LINK="/etc/nginx/sites-enabled/gocart"

# ── Bước 1: Cập nhật hệ thống ─────────────────────────────────────────────────
echo ""
echo "[1/8] Cập nhật hệ thống..."
apt-get update -y && apt-get upgrade -y

# ── Bước 2: Cài đặt các gói thiết yếu ────────────────────────────────────────
echo ""
echo "[2/8] Cài đặt nginx, certbot, curl, ufw..."
apt-get install -y nginx certbot python3-certbot-nginx curl git ufw

# ── Bước 3: Cấu hình Firewall UFW ────────────────────────────────────────────
echo ""
echo "[3/8] Cấu hình tường lửa UFW..."
# Reset về trạng thái mặc định (an toàn)
ufw --force reset

# Chính sách mặc định: từ chối tất cả inbound, cho phép tất cả outbound
ufw default deny incoming
ufw default allow outgoing

# Cho phép SSH (QUAN TRỌNG - không được quên bước này hoặc sẽ bị lock out!)
ufw allow 22/tcp comment 'SSH'

# Cho phép HTTP (dùng cho Let's Encrypt ACME challenge)
ufw allow 80/tcp comment 'HTTP'

# Cho phép HTTPS (traffic chính từ Cloudflare CDN → Nginx)
ufw allow 443/tcp comment 'HTTPS'

# KHÔNG mở cổng 8088 (Backend Spring Boot), 3307 (MySQL), 6379 (Redis)
# → Các service nội bộ này chỉ giao tiếp trong mạng Docker bridge (gocart-net)
# → Người dùng KHÔNG thể kết nối trực tiếp, phải đi qua Nginx → Backend

# Kích hoạt UFW
ufw --force enable
echo "✅ UFW đã được kích hoạt. Trạng thái:"
ufw status verbose

# ── Bước 4: Cài Docker & Docker Compose ──────────────────────────────────────
echo ""
echo "[4/8] Cài đặt Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt."
else
    echo "✅ Docker đã có sẵn, bỏ qua."
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose plugin đã được cài đặt."
else
    echo "✅ Docker Compose đã có sẵn, bỏ qua."
fi

# ── Bước 5: Tạo thư mục dự án ────────────────────────────────────────────────
echo ""
echo "[5/8] Tạo thư mục /opt/gocart..."
mkdir -p "$PROJECT_DIR"
echo "✅ Thư mục $PROJECT_DIR đã được tạo."
echo "   → Copy file docker-compose.prod.yml và .env vào $PROJECT_DIR trước khi chạy deploy.sh"

# ── Bước 6: Cấu hình Nginx (placeholder trước Certbot) ───────────────────────
echo ""
echo "[6/8] Cài đặt Nginx config tạm thời (HTTP only, cần cho Let's Encrypt)..."
cat > "$NGINX_CONF" <<'NGINX_TEMP'
server {
    listen 80;
    server_name api.ecommerce.pro.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "GoCart API Server - SSL pending";
        add_header Content-Type text/plain;
    }
}
NGINX_TEMP

# Kích hoạt site và reload Nginx
ln -sf "$NGINX_CONF" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "✅ Nginx đã được cấu hình tạm thời (HTTP)."

# ── Bước 7: Xin chứng chỉ SSL từ Let's Encrypt ───────────────────────────────
echo ""
echo "[7/8] Xin chứng chỉ SSL từ Let's Encrypt..."
echo "   Domain: $DOMAIN"
echo "   Email:  $EMAIL"

mkdir -p /var/www/certbot

certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN"

echo "✅ Chứng chỉ SSL đã được cấp cho $DOMAIN."

# ── Bước 8: Cài và kích hoạt Nginx config hoàn chỉnh (HTTPS) ─────────────────
echo ""
echo "[8/8] Cài đặt Nginx config production (HTTPS + Proxy)..."

# Copy nginx config từ repo (đã được tạo bởi setup)
if [ -f "$PROJECT_DIR/nginx/gocart.conf" ]; then
    cp "$PROJECT_DIR/nginx/gocart.conf" "$NGINX_CONF"
    nginx -t && systemctl reload nginx
    echo "✅ Nginx production config đã được kích hoạt!"
else
    echo "⚠️  Không tìm thấy $PROJECT_DIR/nginx/gocart.conf"
    echo "   → Hãy copy file nginx/gocart.conf từ repo vào $PROJECT_DIR/nginx/"
fi

# ── Auto-renewal SSL (crob job) ───────────────────────────────────────────────
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
echo "✅ Cronjob auto-renew SSL đã được thiết lập (3:00 AM hàng ngày)."

# ── Bước 9: Kích hoạt Nginx tự khởi động ─────────────────────────────────────
systemctl enable nginx
systemctl start nginx

echo ""
echo "======================================================"
echo " Setup hoàn tất!"
echo "======================================================"
echo ""
echo " Các bước tiếp theo:"
echo "  1. Copy file .env (production secrets) vào $PROJECT_DIR/.env"
echo "  2. Copy file docker-compose.prod.yml vào $PROJECT_DIR/"
echo "  3. Copy thư mục nginx/ vào $PROJECT_DIR/nginx/"
echo "  4. Chạy: cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml pull"
echo "  5. Chạy: docker compose -f docker-compose.prod.yml up -d"
echo "  6. Kiểm tra: curl https://$DOMAIN/api/actuator/health"
echo ""
echo " Trạng thái dịch vụ:"
systemctl status nginx --no-pager | head -5
ufw status
echo ""
