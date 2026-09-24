#!/bin/bash
# CodeLens Backend Deployment Script cho Ubuntu 22.04/24.04
# Lưu ý: Chạy script này bằng quyền root (sudo su)

set -e

echo "=== Bắt đầu cài đặt CodeLens Backend ==="

# 1. Cập nhật hệ thống và cài đặt các gói cần thiết
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

# 2. Cài đặt Docker (dùng cho DockerRunner)
if ! command -v docker &> /dev/null; then
    echo "Đang cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# 3. Cài đặt Node.js 22
if ! command -v node &> /dev/null; then
    echo "Đang cài đặt Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# 4. Clone mã nguồn
cd /opt
if [ -d "codelens" ]; then
    echo "Thư mục codelens đã tồn tại, đang cập nhật..."
    cd codelens
    git pull
else
    echo "Đang tải mã nguồn CodeLens..."
    git clone https://github.com/DevK4z/codelens.git
    cd codelens
fi

# 5. Build Sandbox Docker Image
echo "Đang build Docker Sandbox Image..."
cd backend/sandbox
docker build -t codelens-sandbox .
cd ../

# 6. Cài đặt và build Backend Node.js
echo "Đang cài đặt Node modules và build backend..."
npm ci
npm run build

# 7. Cấu hình biến môi trường
cat <<EOF > .env
PORT=3000
HOST=127.0.0.1
NODE_ENV=production
RUNNER=docker
CORS_ORIGINS=https://devk4z.github.io
EOF

# 8. Cài đặt PM2 và khởi động Backend
echo "Đang cấu hình PM2..."
npm install -g pm2
pm2 stop codelens-backend || true
pm2 start dist/server.js --name "codelens-backend"
pm2 save
pm2 startup | tail -n 1 | bash

echo "=== HOÀN TẤT CÀI ĐẶT CƠ BẢN ==="
echo "Backend đang chạy ở port 3000 (localhost)."
echo "Bước tiếp theo:"
echo "1. Trỏ tên miền (VD: api.yourdomain.com) về IP của máy chủ này."
echo "2. Chạy lệnh: certbot --nginx -d api.yourdomain.com"
echo "3. Cấu hình Nginx reverse proxy sang http://127.0.0.1:3000."

