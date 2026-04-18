#!/bin/bash

# --- CONFIGURATION ---
PROJECT_DIR="/opt/gocart"
ENV_FILE="$PROJECT_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

echo " Bắt đầu quá trình Deploy GoCart..."

# 1. Kiểm tra thư mục dự án
if [ ! -d "$PROJECT_DIR" ]; then
    echo " Lỗi: Thư mục $PROJECT_DIR không tồn tại."
    exit 1
fi

cd $PROJECT_DIR

# 2. Pull code mới nhất (nếu có update file compose hoặc config)
echo " Pulling latest changes from Git..."
git pull origin main

# 3. Pull Images mới nhất từ Docker Hub
echo " Pulling latest Docker images..."
docker compose -f $COMPOSE_FILE pull

# 4. Khởi động lại các Service
echo " Restarting services..."
docker compose -f $COMPOSE_FILE up -d --remove-orphans

# 5. Dọn dẹp Image cũ để tiết kiệm dung lượng VPS
echo " Cleaning up old Docker images..."
docker image prune -f

# 6. Kiểm tra log sơ bộ
echo " Kiểm tra trạng thái các container:"
docker compose -f $COMPOSE_FILE ps

echo " Deploy hoàn tất! Hệ thống đang chạy tại https://ecommerce.pro.vn"
