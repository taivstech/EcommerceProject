#!/bin/bash
set -e # Dừng script ngay lập tức nếu có lệnh nào bị lỗi hoặc bị Ctrl+C

PROJECT_DIR="/opt/gocart"
ENV_FILE="$PROJECT_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

echo "=================================================="
echo " Bắt đầu quá trình Deploy GoCart..."
echo "=================================================="

if [ ! -d "$PROJECT_DIR" ]; then
    echo " Lỗi: Thư mục $PROJECT_DIR không tồn tại."
    exit 1
fi

cd $PROJECT_DIR

# 1. Phát hiện lệnh Docker Compose khả dụng
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo " Lỗi: Không tìm thấy lệnh 'docker compose' hoặc 'docker-compose'!"
    exit 1
fi

echo " Pulling latest changes from Git..."
git pull origin main

echo " Pulling latest Docker images..."
# Chỉ pull service recommendation (các service khác như Elasticsearch, MySQL, Redis, Grafana,... là static và cực kỳ nặng, đã được cache sẵn)
# Thêm || true để nếu mạng chập chờn thì vẫn tiếp tục deploy bằng cache cũ, không làm gián đoạn hệ thống.
if $DOCKER_COMPOSE -f $COMPOSE_FILE --env-file $ENV_FILE pull recommendation; then
    echo " Pull ảnh Docker thành công!"
else
    echo " Cảnh báo: Không thể pull ảnh Docker mới nhất (có thể do lỗi mạng). Sẽ sử dụng bản cache sẵn có để tiếp tục."
fi

echo " Restarting and Building services..."
$DOCKER_COMPOSE -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache
$DOCKER_COMPOSE -f $COMPOSE_FILE --env-file $ENV_FILE up -d --remove-orphans

echo " Cleaning up old Docker images..."
docker image prune -f

echo " Kiểm tra trạng thái các container:"
$DOCKER_COMPOSE -f $COMPOSE_FILE --env-file $ENV_FILE ps

echo "=================================================="
echo " Deploy hoàn tất! Hệ thống đang chạy tại https://ecommerce.pro.vn"
echo "=================================================="
