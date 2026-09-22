# 🔍 CodeLens – Trực quan hóa thuật toán C++ từng bước

CodeLens là nền tảng trực quan hóa thuật toán từ code C++ thực tế, lấy cảm hứng từ các bài giải thuật toán trực quan (NeetCode, VisuAlgo) nhưng chạy trên chính đoạn mã và dữ liệu đầu vào do bạn nhập.

---

## 🌟 Tính năng nổi bật

1. **Trình soạn thảo Monaco Editor**:
   - Tô màu cú pháp C++, hiển thị số dòng.
   - Tự động tô sáng dòng code đang thực thi theo từng bước trace.
   - Báo lỗi biên dịch và cú pháp tiếng Việt trực quan.

2. **Thu thập Execution Trace thật**:
   - Không bịa trace bằng AI, không dùng regex giả lập.
   - Code C++ được phân tích cú pháp (AST), chèn instrumentation (`__cl_*`), biên dịch bằng `g++` và chạy thật với dữ liệu đầu vào.
   - Thu thập snapshot biến, mảng, call stack, thao tác đọc/ghi/so sánh/hoán đổi và stdout theo thời gian thực.

3. **Điều khiển phát từng bước (Trace Player)**:
   - **Run**: Biên dịch và chạy thực tế.
   - **Play / Pause**: Tự động phát với tốc độ tùy chỉnh (0.25x - 4x).
   - **Next / Previous**: Tiến/lùi từng bước (Previous đọc lại snapshot đã ghi, không chạy ngược code).
   - **Timeline Slider**: Kéo chọn bất kỳ bước nào trong toàn bộ quá trình thực thi.

4. **Trực quan hóa cấu trúc dữ liệu**:
   - **Mảng/Vector**: Hiển thị các ô nhớ có index, giá trị. Tô màu thao tác:
     - 🔵 Xanh dương: **ĐỌC** dữ liệu
     - 🟠 Cam: **GHI / CẬP NHẬT**
     - 🟡 Vàng: **SO SÁNH** (kèm biểu thức so sánh thời gian thực)
     - 🟣 Tím: **HOÁN ĐỔI (SWAP)**
   - **Con trỏ (Two Pointers / Binary Search)**: Hiển thị mũi tên và nhãn con trỏ (`left`, `right`, `mid`) ngay bên dưới các phần tử mảng.
   - **Cây đệ quy**: Trực quan hóa Call Stack khi thực thi các hàm đệ quy.

5. **Bảng dữ liệu phía dưới**:
   - **Biến**: Danh sách biến, kiểu dữ liệu, giá trị, nhấp nháy cam khi thay đổi, cho phép gán vai trò (`Mảng`, `Con trỏ trái`, `Con trỏ phải`,...).
   - **Call Stack**: Các tầng hàm đang hoạt động và số dòng gọi.
   - **Giải thích**: Diễn giải bằng tiếng Việt hành động của bước hiện tại.
   - **Console**: Hiển thị `stdout` tích lũy đến bước đang xem.

---

## 🚀 Hướng dẫn khởi chạy

### Yêu cầu tiên quyết
- **Node.js** >= 22.12
- **g++** (GCC C++ Compiler, hỗ trợ C++17)

### 1. Khởi động Backend
```bash
cd backend
npm install
npm run dev
# Server chạy tại: http://localhost:3001
```

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

---

## 🧪 4 Thuật toán mẫu có sẵn

| Thuật toán | Input mẫu | Điểm quan sát chính |
|---|---|---|
| **Tính tổng mảng** | `5\n1 2 3 4 5` | Biến `sum` và `i` tăng dần, mảng highlight phần tử đang đọc |
| **Tìm kiếm nhị phân** | `7\n1 3 5 7 9 11 13\n7` | Ba con trỏ `left`, `right`, `mid` di chuyển và thu hẹp vùng tìm kiếm |
| **Sắp xếp nổi bọt** | `5\n5 3 1 4 2` | Từng cặp ô được highlight vàng so sánh và tím khi hoán đổi |
| **Giai thừa đệ quy** | `5` | Ngăn xếp gọi hàm sâu 5 tầng từ `main` → `factorial(5)` → ... → `factorial(1)` |

---

## 🛡️ Giới hạn & Cấu hình Sandbox

- **Giới hạn bước (Step limit)**: Tối đa `10,000` bước (ngăn chặn vòng lặp vô tận).
- **Giới hạn thời gian (Timeout)**: Tối đa `5 giây` CPU time.
- **Whitelist Header**: `<iostream>`, `<vector>`, `<algorithm>`, `<string>`, `<cmath>`, `<cstdio>`, `<cstdlib>`, `<climits>`, `<stack>`, `<queue>`.
- **Cấu hình Docker Sandbox (cho Production)**: Thư mục `runner/` cung cấp sẵn `Dockerfile` và `run.sh` trên nền Alpine Linux làm cơ sở triển khai; DockerRunner chưa được hiện thực nên hiện chưa có sandbox production.


## Bản sửa tính đúng đắn (22/09/2026)

- Chạy code không tự chuyển sang demo khi lỗi. Chọn bài mẫu để phát bản ghi; chỉnh sửa code hoặc stdin sẽ dừng phát, bỏ highlight và yêu cầu chạy lại.
- Phản hồi của lần chạy đã bị thay thế không ghi đè bài hiện tại. Lỗi kết nối hiển thị riêng trên giao diện.
- Trace mẫu được tạo lại từ `frontend/src/data/samples.ts`, gồm đúng `mid` của binary search và từng bước trả về của đệ quy, ID và tham số frame.
- Điều kiện if/while và biểu thức cout được đánh giá một lần. Khai báo scalar/array không còn bị tự thêm giá trị 0.
- Giải thích bước hiện tại đặt cạnh vùng trực quan. Mảng hiển thị kích thước thực trong trace (tối đa 100 ô), không suy đoán từ biến n.

### Cài đặt và kiểm tra bản sửa

Dùng Node.js 22.12+ hoặc 24 và g++ hỗ trợ C++17.

```bash
cd backend
npm ci
npm test
npm run build
npm run traces
npm run dev
```

Trong terminal khác:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
# npm run build để tạo dist
```

`npm run traces` tái tạo dữ liệu từ code/input chuẩn. Không sửa tay demoTraces.ts. Bài test regression so sánh toàn bộ trace mẫu với kết quả thực thi mới và kiểm tra target tìm thấy/không tìm thấy, trả về đệ quy và tác dụng phụ của biểu thức.

### GitHub Pages và backend

Frontend đọc `VITE_API_BASE_URL`, bao gồm hậu tố `/api` (ví dụ `https://backend.example/api`). Biến cũ `VITE_API_URL` vẫn được chấp nhận. Không có cấu hình production thì trang dùng bài mẫu và thông báo chưa cấu hình backend khi nhấn Chạy. Workflow Pages lấy URL từ Repository variable `VITE_API_BASE_URL`; thay biến phải build lại.

Backend mặc định chỉ bind `127.0.0.1`. Có thể cấu hình `PORT`, `HOST` và `CORS_ORIGINS` (danh sách origin cách nhau bằng dấu phẩy). Endpoint health cần trả JSON `{ "status": "ok" }`.

**Giới hạn quan trọng:** DockerRunner hiện chỉ là stub. API thực thi bị khóa khi `NODE_ENV=production`; chưa được triển khai để chạy code không tin cậy trên Internet. LocalRunner chỉ dành cho code tin cậy trên máy phát triển. Dockerfile có sẵn không đồng nghĩa hệ thống đã có sandbox hoàn chỉnh. Cần hiện thực runner cách ly trước khi mở API công khai; không bỏ chặn production để thay thế bước này.

### Phạm vi chưa hoàn thiện

Parser chỉ hỗ trợ một tập con C++, không phải trình biên dịch C++ tổng quát. Kiểu do người dùng định nghĩa, phương thức STL ngoài phạm vi và cú pháp khác có thể bị từ chối. Instrumentation chưa bảo đảm mọi trường hợp alias/reference, tên biến bị che khuất, chỉ số có tác dụng phụ, hoặc chương trình có hành vi không xác định. Không dùng các trace đó làm bằng chứng về tính đúng của C++ tổng quát. Bảng DP, kiểm thử trình duyệt tự động và AI chưa nằm trong bản sửa này.

Các bài mảng dùng `arr[10]`: input cần `0 <= n <= 10`. Bài giai thừa dùng int: chỉ dùng `0 <= n <= 12`. Bộ kiểm tra hiện xác nhận các bài mẫu và trường hợp regression cụ thể, không khẳng định hỗ trợ toàn bộ C++.
