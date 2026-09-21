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
- **Node.js** >= 18.x
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
- **Cấu hình Docker Sandbox (cho Production)**: Thư mục `runner/` cung cấp sẵn `Dockerfile` và `run.sh` trên nền Alpine Linux để cách ly hoàn toàn hệ thống khi triển khai thực tế.

