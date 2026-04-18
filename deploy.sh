PROJECT_DIR="/opt/gocart"
ENV_FILE="$PROJECT_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

echo " Bắt đầu quá trình Deploy GoCart..."

if [ ! -d "$PROJECT_DIR" ]; then
    echo " Lỗi: Thư mục $PROJECT_DIR không tồn tại."
    exit 1
fi

cd $PROJECT_DIR
echo " Pulling latest changes from Git..."
git pull origin main

echo " Pulling latest Docker images..."
docker compose -f $COMPOSE_FILE pull

echo " Restarting and Building services..."
docker compose -f $COMPOSE_FILE build --no-cache frontend
docker compose -f $COMPOSE_FILE up -d --remove-orphans

echo " Cleaning up old Docker images..."
docker image prune -f

echo " Kiểm tra trạng thái các container:"
docker compose -f $COMPOSE_FILE ps

echo " Deploy hoàn tất! Hệ thống đang chạy tại https://ecommerce.pro.vn"
