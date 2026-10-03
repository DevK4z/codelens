# Phạm vi trực quan hóa C++

CodeLens có hai đường chạy:

- **Trực quan hóa từng bước**: parser tạo AST, chèn theo dõi biến/dòng lệnh, rồi GCC biên dịch. Chỉ các cấu trúc parser và bộ ghi trạng thái hiểu được mới có trace.
- **Chạy C++ / thi đấu**: GCC biên dịch code gốc trong Docker với GNU++17/GNU++20. Không tạo trace; không dùng kết quả stdout để giả lập các bước.

## Bản sửa kiểu dữ liệu

Hỗ trợ khai báo biến, tham số và kiểu trả về nhiều từ (`long long`, `unsigned long long`, `long long int`, `long double`), alias đơn giản bằng `typedef` / `using`, alias lồng trong block, biến toàn cục và template `vector` / `pair` lồng nhau. Con trỏ, alias hàm/mảng và alias template chưa được bổ sung.

Literal được giữ nguyên khi sinh C++ (đuôi `LL`/`ULL`, cơ số 2/16, số mũ, dấu phân tách chữ số). Snapshot dùng kiểu thực tế thay vì ép xuống `int`. Số nguyên ngoài khoảng an toàn của JavaScript được trả về dưới dạng chuỗi thập phân để giữ đúng giá trị. Pair có dạng `{first, second}`, vector có dạng mảng; việc hiển thị các cấu trúc này không đồng nghĩa mọi toán tử/phương thức của chúng đã được parser hỗ trợ.

Các giới hạn còn lại gồm class, con trỏ, lambda, macro phức tạp và nhiều cấu trúc STL. Chưa có cam kết hỗ trợ mọi C++ hợp lệ. Để mở rộng tổng quát cần một backend compiler/debugger (ví dụ Clang AST hoặc GDB), có giới hạn thời gian/bộ nhớ/số bước, giữ cách ly Docker và kiểm chứng trạng thái thực. Không tự động đổi chế độ chạy rồi báo đã trực quan hóa thành công.

## Cập nhật backend đang chạy trên máy cá nhân

Trong thư mục repository đã nhận bản sửa:

```powershell
cd backend
npm ci
npm run build
npm start
```

Dừng tiến trình backend cũ bằng Ctrl+C trước khi chạy lại. Giữ cửa sổ Cloudflare Tunnel đang chạy để URL không đổi. Bản sửa parser này không thay đổi Docker image; cập nhật GitHub Pages đơn lẻ không cập nhật backend trên máy cá nhân.

Kiểm tra hồi quy: `npm test`; riêng các trường hợp kiểu dữ liệu: `npm run test:types` (cần g++).
