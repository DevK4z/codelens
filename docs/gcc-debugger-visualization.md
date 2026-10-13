# Trực quan hóa code gốc bằng GCC/GDB

Khi backend dùng `RUNNER=docker` (hoặc production), API `mode=visualize` gửi nguyên code cho GCC với GNU++17/GNU++20 và thông tin debug. GDB dừng ở các dòng thực thi trong `code.cpp`, đọc biến và stack từ bộ nhớ, rồi tạo trace. Parser TypeScript không chặn cú pháp của đường chạy này. Không đánh giá biểu thức của người dùng hoặc gọi hàm trong inferior để lấy snapshot.

`mode=run` tiếp tục chạy code gốc bình thường. LocalRunner phục vụ development vẫn sử dụng parser/bộ chèn theo dõi cũ. Để sử dụng chế độ GCC/GDB trên web, backend phải chạy trong Docker.

## Cập nhật trên Windows

Dừng backend cũ bằng Ctrl+C. Mở PowerShell tại thư mục `codelens`, bật Docker Desktop và chạy từng lệnh:

```powershell
git pull --ff-only
docker build -t codelens-sandbox ./backend/sandbox
cd backend
npm ci
npm run build
$env:RUNNER="docker"
$env:CORS_ORIGINS="https://devk4z.github.io,http://localhost:5173,http://localhost:5175"
npm start
```

Nếu git pull báo thay đổi cục bộ, dừng và lưu/đối chiếu chúng trước. Không xóa thay đổi cũ. Giữ nguyên cửa sổ tunnel để tránh thay đổi URL. Nếu dùng frontend local, cập nhật/build lại frontend từ cùng phiên bản.

## Ý nghĩa và giới hạn trace

- Trạng thái tại mỗi điểm dừng là **trước khi thực thi dòng đang tô sáng**. Nhiều câu lệnh trên cùng dòng có thể chỉ tạo một điểm dừng. Hàm inline, macro và tối ưu hóa bằng pragma có thể làm dòng/biến không đủ thông tin debug.
- GDB không suy ra đầy đủ việc khởi tạo biến. Biến có dòng khai báo chưa thực thi được hiển thị null; giá trị không đọc được hiển thị `<unavailable>` hoặc `<optimized out>`.
- Mảng/container tối đa 100 phần tử, snapshot tối đa 4 tầng và 200 biến, stack tối đa 64 frame, trace tối đa 2000 điểm dừng. Mỗi luồng stdout/stderr/trace giới hạn 1MiB; vượt giới hạn báo lỗi thay vì trả thành công với dữ liệu bị cắt. Số nguyên ngoài khoảng an toàn JavaScript dùng chuỗi thập phân.
- Con trỏ được hiển thị địa chỉ, không tự động dereference. Kiểu STL phụ thuộc layout/pretty-printer mà GDB có; không cam kết hiển thị mọi kiểu.
- Trace theo dòng không tự tạo các nhãn compare/swap/arrayAccess của bộ chèn theo dõi cũ. Stdout trong trace là nội dung đã flush tại thời điểm dừng; stdout cuối được trả riêng.
- Giữ giới hạn CPU, RAM, process, thời gian compile/run, filesystem readonly, network none và cap-drop ALL. Không dùng `--privileged` hoặc bỏ seccomp. Nếu host không cho phép ptrace giữa GDB và tiến trình con của nó, trả lỗi debugger để người dùng biết thay vì giả lập trace.
- Có thể biên dịch cú pháp GCC hỗ trợ trong môi trường đã cài thư viện; không cam kết mọi chương trình (nhiều file, thư viện ngoài, chương trình tương tác kéo dài, đa luồng, hành vi không xác định).

Kiểm tra thực tế Docker: `TEST_DOCKER=1 npm run test:debugger` ở backend (PowerShell: `$env:TEST_DOCKER="1"`).
