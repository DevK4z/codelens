# Hướng Dẫn Triển Khai CodeLens Lên Môi Trường Production (Online VPS)

Để đáp ứng tiêu chuẩn an toàn bảo mật (không chạy trực tiếp C++ của người dùng trên máy chủ thực), CodeLens được thiết kế để sử dụng Docker làm môi trường cách ly (Sandbox). Backend Node.js sẽ chạy trên máy chủ thật (Host) và gọi Docker cho mỗi lượt chạy code, tuyệt đối **không mount docker socket vào trong container** để tránh leo thang đặc quyền.

## Yêu cầu hệ thống
- Máy chủ Linux (Ubuntu 22.04 / Debian 12 / CentOS) có tối thiểu 1GB RAM (khuyến nghị 2GB).
- Đã cài đặt **Node.js 22** và **npm**.
- Đã cài đặt **Docker** (Docker Engine).

## Bước 1: Build Docker Image cho Sandbox

Sandbox là một image cực nhẹ dựa trên Alpine Linux, chỉ chứa bộ biên dịch `g++`, `jq` và môi trường tối thiểu.

Tại thư mục gốc của dự án, di chuyển vào thư mục `backend/sandbox` và chạy lệnh build:

```bash
cd backend/sandbox
docker build -t codelens-sandbox .
```

*Lưu ý: Bạn chỉ cần build image này một lần trên máy chủ (hoặc khi có cập nhật script run.sh). Quá trình chạy mỗi tác vụ sẽ sinh ra một container tạm thời từ image này và tự hủy ngay sau khi xong (`--rm`).*

## Bước 2: Build Backend Node.js

Quay lại thư mục `backend` và build mã nguồn TypeScript:

```bash
cd ..
npm ci
npm run build
```

## Bước 3: Cấu hình Biến Môi Trường (Môi trường Host)

Tạo file `.env` trong thư mục `backend`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
RUNNER=docker
# Đổi thành URL frontend của bạn (VD: https://devk4z.github.io)
CORS_ORIGINS=https://devk4z.github.io
```

## Bước 4: Khởi động Backend (Sử dụng PM2)

Nên sử dụng `pm2` để giữ backend luôn chạy ổn định trên máy chủ.

```bash
npm install -g pm2
pm2 start dist/server.js --name "codelens-backend"
```

---

## Cơ Chế Bảo Mật & Cách Ly Của DockerRunner
Hệ thống sử dụng file `backend/src/runner/dockerRunner.ts` thay cho `local.ts` trên môi trường Production:
1. **Network None**: Container bị ngắt hoàn toàn kết nối mạng (`--network none`). Không thể request ra ngoài hay đào coin.
2. **Memory Limit**: Giới hạn RAM tối đa 256MB (`--memory 256m`) tránh người dùng cấp phát mảng quá lớn làm OOM máy chủ.
3. **CPU Limit**: Giới hạn sử dụng 1 CPU (`--cpus 1.0`) để tránh treo máy.
4. **Time Limit**: Thời gian chờ (Timeout) được kiểm soát bởi cả Docker và Node.js, process sẽ bị force kill nếu chạy quá 5 giây (do lặp vô hạn).
5. **Read-Only / No Mount**: C++ code và Standard Input được truyền vào trực tiếp thông qua Pipe (luồng `stdin`) định dạng JSON, không mount bất kỳ file hoặc ổ đĩa nào từ Host vào. Kết quả được đọc qua `stdout/stderr`. Tuyệt đối an toàn.
6. **Drop Privileges**: Image chạy bằng user `runner` (không phải root).

## Bước 5: Cấu Hình Frontend Để Trỏ Về Backend

Sau khi Backend đã chạy ở địa chỉ IP của VPS (hoặc domain mà bạn cài Nginx reverse proxy chỉ tới nó, ví dụ: `https://api.yourdomain.com`), hãy cấu hình Github Actions:

1. Vào Github Repository của bạn > **Settings** > **Secrets and variables** > **Actions** > **Variables**.
2. Bấm **New repository variable**.
3. Name: `VITE_API_BASE_URL`
4. Value: `https://api.yourdomain.com/api` (URL của backend).
5. Chạy lại Github Actions để Vite đóng gói biến này vào trang tĩnh.

Trang web CodeLens của bạn nay đã hoàn toàn an toàn và sẵn sàng đón người dùng public!

