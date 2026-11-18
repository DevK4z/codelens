# Hướng Dẫn Triển Khai Backend CodeLens

Để đáp ứng tiêu chuẩn an toàn bảo mật (không chạy trực tiếp C++ của người dùng trên máy chủ thực), CodeLens được thiết kế để sử dụng Docker làm môi trường cách ly (Sandbox). Backend Node.js sẽ chạy trên máy chủ thật (Host) và gọi Docker cho mỗi lượt chạy code, tuyệt đối **không mount docker socket vào trong container** để tránh leo thang đặc quyền.

## Cách 1: Render (khuyến nghị)

Render không cho chạy Docker bên trong service, nên không dùng được `DockerRunner` (một container cho mỗi lần chạy). Thay vào đó, [`backend/Dockerfile`](backend/Dockerfile) đóng gói backend cùng GCC/GDB, và chính container của Render là lớp cô lập ngoài cùng (`RUNNER=sandbox`). Bên trong, launcher [`runner/jail.c`](runner/jail.c) cô lập từng lần chạy:

| Lớp | Tác dụng |
| --- | --- |
| uid riêng cho mỗi run (20000–20063) | Không phải root; các run chạy song song không đọc, ptrace hay kill được nhau |
| seccomp | Chặn mọi socket mạng (IPv4/IPv6...) và `io_uring`; Unix socket vẫn dùng được |
| rlimit | Bộ nhớ 512 MB/tiến trình (`SANDBOX_MEMORY_MB`), 64 tiến trình, file 64 MB, 60s CPU |
| Môi trường sạch | Không thừa hưởng biến môi trường hay file descriptor của service, nên không lộ secret |
| Thư mục riêng 0700 | Trong `/tmp/codelens-runs` (0711), không liệt kê được run khác; xoá sau mỗi lần chạy |
| Dọn tiến trình | Khi run kết thúc, mọi tiến trình của uid đó bị kill, kể cả daemon đã `setsid`; `tini` dọn zombie |

Mọi bước đều fail-closed. `GET /api/v1/health` còn chạy thử một tiến trình trong jail, xác nhận uid đã đổi và socket mạng bị chặn **trên chính host đó**; nếu nền tảng không thực thi được seccomp hay setuid, health trả `503` và không nhận code. CI build image này và chạy [`render-sandbox.test.ts`](backend/render-sandbox.test.ts) trong container không privileged để kiểm tra lại từng lớp.

### Triển khai

1. Đăng nhập [Render](https://dashboard.render.com) bằng GitHub, chọn **New → Blueprint**, chọn repository này. Render đọc [`render.yaml`](render.yaml) và tạo service `codelens-api` (Docker, region Singapore).
2. Chờ build xong (lần đầu vài phút vì biên dịch sẵn `bits/stdc++.h`), mở `https://<service>.onrender.com/api/v1/health` và kiểm tra `{"status":"ok","runner":"sandbox"}`.
3. Trong GitHub repository: Settings → Secrets and variables → Actions → Variables, đặt `VITE_API_BASE_URL=https://<service>.onrender.com/api`.
4. Chạy lại workflow **Deploy to GitHub Pages**. Bước kiểm tra backend tự thử lại tối đa 3 phút, nên service đang ngủ vẫn kịp thức dậy.

Sau đó mỗi lần push thay đổi trong `backend/`, `runner/` hoặc `render.yaml`, Render tự deploy lại.

### Gói free và gói trả phí

`render.yaml` dùng `plan: free` (0.1 CPU, 512 MB). Đo trên chính image này:

| | Free (0.1 CPU) | Starter (0.5 CPU) |
| --- | --- | --- |
| Chạy code có `bits/stdc++.h` | ~8s | ~1s |
| Trực quan hóa từng bước (GDB) | ~15s | ~2s |
| Khi không có request 15 phút | Ngủ; lần đầu vào chờ ~1 phút | Không ngủ |

Trên free, `RUN_TIMEOUT_MS=20000` cho GDB đủ thời gian (mặc định 5s sẽ hết giờ) và `MAX_CONCURRENT_RUNS=1` để 512 MB không bị tràn. Đổi sang `plan: starter` thì nên đặt lại `RUN_TIMEOUT_MS=5000` để vòng lặp vô hạn bị dừng sớm hơn.

## Cách 2: VPS có Docker

Trên máy chủ tự quản lý có Docker Engine, `RUNNER=docker` chạy mỗi lần thực thi trong một container mới, `--network none`, read-only. Các bước dưới đây áp dụng cho cách này.

### Yêu cầu hệ thống
- Máy chủ Linux (Ubuntu 22.04 / Debian 12 / CentOS) có tối thiểu 1GB RAM (khuyến nghị 2GB).
- Đã cài đặt **Node.js 22** và **npm**.
- Đã cài đặt **Docker** (Docker Engine).

### Bước 1: Build Docker Image cho Sandbox

Sandbox là một image cực nhẹ dựa trên Alpine Linux, chỉ chứa bộ biên dịch `g++`, `jq` và môi trường tối thiểu.

Tại thư mục gốc của dự án, di chuyển vào thư mục `backend/sandbox` và chạy lệnh build:

```bash
cd backend/sandbox
docker build -t codelens-sandbox .
```

*Lưu ý: Bạn chỉ cần build image này một lần trên máy chủ (hoặc khi có cập nhật script run.sh). Quá trình chạy mỗi tác vụ sẽ sinh ra một container tạm thời từ image này và tự hủy ngay sau khi xong (`--rm`).*

### Bước 2: Build Backend Node.js

Quay lại thư mục `backend` và build mã nguồn TypeScript:

```bash
cd ..
npm ci
npm run build
```

### Bước 3: Cấu hình Biến Môi Trường (Môi trường Host)

Tạo file `.env` trong thư mục `backend`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
RUNNER=docker
# Đổi thành URL frontend của bạn (VD: https://devk4z.github.io)
CORS_ORIGINS=https://devk4z.github.io
# Giới hạn chống lạm dụng cho POST /api/v1/runs
RATE_LIMIT_PER_MIN=20
MAX_CONCURRENT_RUNS=2
MAX_QUEUED_RUNS=8
```

> **Bắt buộc runner cô lập khi public backend**: `RUNNER=docker` trên VPS, `RUNNER=sandbox` trên Render (đã đặt sẵn trong image). `LocalRunner` chạy code thẳng trên máy chủ, không cách ly, nên nó từ chối mọi request đi qua proxy và `/api/v1/health` trả 503. Deploy Pages sẽ dừng ở bước kiểm tra backend thay vì public một runner không sandbox.

### Bước 4: Khởi động Backend (Sử dụng PM2)

Nên sử dụng `pm2` để giữ backend luôn chạy ổn định trên máy chủ.

```bash
npm install -g pm2
pm2 start dist/server.js --name "codelens-backend"
```

---

### Cơ Chế Bảo Mật & Cách Ly Của DockerRunner
Hệ thống sử dụng file `backend/src/runner/dockerRunner.ts` thay cho `local.ts` trên môi trường Production:
1. **Network None**: Container bị ngắt hoàn toàn kết nối mạng (`--network none`). Không thể request ra ngoài hay đào coin.
2. **Memory Limit**: Giới hạn RAM tối đa 256MB (`--memory 256m`) tránh người dùng cấp phát mảng quá lớn làm OOM máy chủ.
3. **CPU Limit**: Giới hạn sử dụng 1 CPU (`--cpus 1.0`) để tránh treo máy.
4. **Time Limit**: Thời gian chờ (Timeout) được kiểm soát bởi cả Docker và Node.js, process sẽ bị force kill nếu chạy quá 5 giây (do lặp vô hạn).
5. **Read-Only / No Mount**: C++ code và Standard Input được truyền vào trực tiếp thông qua Pipe (luồng `stdin`) định dạng JSON, không mount bất kỳ file hoặc ổ đĩa nào từ Host vào. Kết quả được đọc qua `stdout/stderr`. Tuyệt đối an toàn.
6. **Drop Privileges**: Image chạy bằng user `runner` (không phải root).

### Bước 5: Cấu Hình Frontend Để Trỏ Về Backend

Sau khi Backend đã chạy ở địa chỉ IP của VPS (hoặc domain mà bạn cài Nginx reverse proxy chỉ tới nó, ví dụ: `https://api.yourdomain.com`), hãy cấu hình Github Actions:

1. Vào Github Repository của bạn > **Settings** > **Secrets and variables** > **Actions** > **Variables**.
2. Bấm **New repository variable**.
3. Name: `VITE_API_BASE_URL`
4. Value: `https://api.yourdomain.com/api` (URL của backend).
5. Chạy lại Github Actions để Vite đóng gói biến này vào trang tĩnh.

Trang web CodeLens của bạn nay đã hoàn toàn an toàn và sẵn sàng đón người dùng public!

