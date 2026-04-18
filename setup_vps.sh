set -e

DOMAIN="ecommerce.pro.vn"
EMAIL="admin@ecommerce.pro.vn"
PROJECT_DIR="/opt/gocart"
NGINX_CONF="/etc/nginx/sites-available/gocart"
NGINX_LINK="/etc/nginx/sites-enabled/gocart"


apt-get update -y && apt-get upgrade -y

echo ""
echo "[2/8] Cài đặt nginx, certbot, curl, ufw..."
apt-get install -y nginx certbot python3-certbot-nginx curl git ufw
echo ""
echo "[3/8] Cấu hình tường lửa UFW..."

ufw --force reset

ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp comment 'SSH'


ufw allow 80/tcp comment 'HTTP'


ufw allow 443/tcp comment 'HTTPS'


ufw --force enable
echo "UFW đã được kích hoạt. Trạng thái:"
ufw status verbose

echo ""
echo "[4/8] Cài đặt Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
    echo "Docker đã được cài đặt."
else
    echo "Docker đã có sẵn, bỏ qua."
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
    echo "Docker Compose plugin đã được cài đặt."
else
    echo "Docker Compose đã có sẵn, bỏ qua."
fi
─
echo ""
echo "[5/8] Cấu hình hệ thống cho Elasticsearch..."
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p

echo ""
echo "[6/8] Tạo thư mục /opt/gocart..."
mkdir -p "$PROJECT_DIR"
echo "Thư mục $PROJECT_DIR đã được tạo."
echo "   → Copy file docker-compose.prod.yml và .env vào $PROJECT_DIR trước khi chạy deploy.sh"

echo ""
echo "[7/8] Cài đặt Nginx config tạm thời (HTTP only, cần cho Let's Encrypt)..."
cat > "$NGINX_CONF" <<'NGINX_TEMP'
server {
    listen 80;
    server_name ecommerce.pro.vn www.ecommerce.pro.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "GoCart Server - SSL pending";
        add_header Content-Type text/plain;
    }
}
NGINX_TEMP

ln -sf "$NGINX_CONF" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

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

echo "Chứng chỉ SSL đã được cấp cho $DOMAIN."

echo ""
echo "[8/8] Cài đặt Nginx config production (HTTPS + Proxy)..."

if [ -f "$PROJECT_DIR/nginx/gocart.conf" ]; then
    cp "$PROJECT_DIR/nginx/gocart.conf" "$NGINX_CONF"
    nginx -t && systemctl reload nginx
    echo "Nginx production config đã được kích hoạt!"
else
    echo "Không tìm thấy $PROJECT_DIR/nginx/gocart.conf"
fi

(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
echo "Cronjob auto-renew SSL đã được thiết lập (3:00 AM hàng ngày)."

systemctl enable nginx
systemctl start nginx
