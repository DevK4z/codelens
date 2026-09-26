# CodeLens

**Trực quan hóa thuật toán C++ từng bước để học cấu trúc dữ liệu và giải thuật.**

CodeLens kết hợp trình soạn thảo, dữ liệu đầu vào, bản ghi thực thi và vùng trực quan trong một giao diện. Bạn có thể quan sát biến, mảng, ngăn xếp lời gọi và kết quả chương trình để hiểu thuật toán đang làm gì ở mỗi bước.

[Website](https://devk4z.github.io/codelens/) · [Báo lỗi](https://github.com/DevK4z/codelens/issues) · [Mã nguồn](https://github.com/DevK4z/codelens)

> **Trạng thái dự án:** đang phát triển. Website GitHub Pages và mã nguồn trên `main` có thể khác phiên bản. Mã nguồn được đối chiếu tại commit `72aa246`: stdout đã có phần xử lý; tích hợp AI chưa hoàn chỉnh; còn lỗi cú pháp và sự không thống nhất của runner cần xử lý trước khi triển khai. Xem [giới hạn hiện tại](#giới-hạn-hiện-tại).

## Nội dung

- [Tính năng](#tính-năng)
- [Cách hoạt động](#cách-hoạt-động)
- [Chạy trên máy cá nhân](#chạy-trên-máy-cá-nhân)
- [Sử dụng CodeLens](#sử-dụng-codelens)
- [STDIN và STDOUT](#stdin-và-stdout)
- [AI hỗ trợ học thuật toán](#ai-hỗ-trợ-học-thuật-toán)
- [API và cấu hình](#api-và-cấu-hình)
- [Triển khai](#triển-khai)
- [Kiểm thử](#kiểm-thử)
- [Giới hạn hiện tại](#giới-hạn-hiện-tại)
- [Đóng góp](#đóng-góp)

## Tính năng

| Thành phần | Chức năng trong mã nguồn |
| --- | --- |
| Trình soạn thảo Monaco | Viết C++, tô màu cú pháp và đánh dấu dòng đang xem |
| STDIN | Nhập dữ liệu đầu vào trước khi chạy |
| Execution trace | Ghi trạng thái thực thi từ chương trình được chèn mã theo dõi |
| Trace player | Phát/tạm dừng, tiến/lùi, kéo timeline; tốc độ 0.25×–4× |
| Mảng và biến | Quan sát giá trị, chỉ số và các thao tác được trace ghi nhận |
| Call stack | Theo dõi lời gọi và trả về của hàm, hỗ trợ học đệ quy |
| Giải thích từng bước | Diễn giải sự kiện bằng các quy tắc trong ứng dụng |
| Console / stdout | Xem đầu ra chương trình và thông báo lỗi |
| Bài mẫu | Tổng mảng, tìm kiếm nhị phân, sắp xếp nổi bọt, giai thừa |
| AI giải thích | Có giao diện dự kiến dùng Gemini; phần gọi dịch vụ **chưa được hiện thực đầy đủ** |

## Cách hoạt động

1. Frontend gửi mã C++ và stdin đến `POST /api/execute`.
2. Backend tách token, phân tích cú pháp và chèn mã theo dõi vào chương trình.
3. Runner biên dịch bằng `g++`, chạy chương trình và thu thập stdout cùng trace.
4. Backend trả kết quả JSON; frontend phát lại trace để trực quan hóa từng bước.

**Trace được thu thập từ quá trình chạy, không do AI tạo.** Nút lùi đọc lại trạng thái đã ghi, không chạy ngược chương trình. Luồng API hiện trả kết quả sau khi hoàn tất yêu cầu; không phải truyền stdout trực tiếp bằng WebSocket/SSE.

### Công nghệ và cấu trúc

Frontend sử dụng React, TypeScript, Vite, Tailwind CSS và Monaco Editor. Backend sử dụng Node.js, Express, TypeScript; việc biên dịch dùng GCC C++17. DockerRunner là hướng chạy cách ly cho production.

| Đường dẫn | Vai trò |
| --- | --- |
| [`frontend/src/components/`](frontend/src/components/) | Editor, console, bảng biến, call stack, trực quan và giải thích |
| [`frontend/src/engine/`](frontend/src/engine/) | API client, kiểu dữ liệu, giải thích và file tích hợp AI |
| [`frontend/src/data/`](frontend/src/data/) | Bài mẫu và trace mẫu |
| [`backend/src/engine/`](backend/src/engine/) | Lexer, parser và instrumentation |
| [`backend/src/routes/execute.ts`](backend/src/routes/execute.ts) | API chạy C++ |
| [`backend/src/runner/`](backend/src/runner/) | LocalRunner và DockerRunner |
| [`runner/`](runner/) | Image/script sandbox được workflow CI build |
| [`scripts/`](scripts/) | Công cụ kiểm tra cấu hình backend |
| [`.github/workflows/`](.github/workflows/) | CI và triển khai GitHub Pages |

## Chạy trên máy cá nhân

### Yêu cầu

- Git, Node.js 22.12+ và npm.
- `g++` hỗ trợ C++17, có trong `PATH` nếu sử dụng LocalRunner.
- Docker nếu sử dụng DockerRunner. Việc có Docker chưa đủ để xác nhận sandbox hoạt động; xem giới hạn bên dưới.

> Các lệnh dưới đây mô tả quy trình của dự án. Phiên bản được đối chiếu còn lỗi mã nguồn cần sửa; nếu build thất bại, xem mục giới hạn thay vì bỏ qua kiểm tra.

```bash
git clone https://github.com/DevK4z/codelens.git
cd codelens
```

**Terminal 1 — backend:**

```bash
cd backend
npm ci
npm run dev
```

Backend mặc định lắng nghe tại `http://127.0.0.1:3001`. Chế độ local chỉ dành cho code bạn tin cậy trên máy phát triển.

**Terminal 2 — frontend, bắt đầu từ thư mục gốc repository:**

```bash
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:5173`. Khi chạy local và không đặt biến API, frontend mặc định dùng `http://localhost:3001/api`.

Để chỉ định backend khác, tạo `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api
```

Khởi động lại Vite sau khi đổi biến môi trường. Không đặt API key hoặc secret trong biến `VITE_*`.

## Sử dụng CodeLens

1. Chọn bài mẫu hoặc nhập mã C++ của bạn.
2. Nhập dữ liệu vào ô STDIN.
3. Nhấn **Chạy** để yêu cầu backend biên dịch và thực thi.
4. Dùng **Bước tiếp**, **Bước trước**, **Phát** và timeline để quan sát trace.
5. Mở **Biến**, **Call Stack**, **Giải thích** hoặc **Console** để xem chi tiết.

Chọn bài mẫu có thể phát bản ghi có sẵn. Đây không phải bằng chứng backend đang kết nối. Sau khi sửa code hoặc stdin, cần chạy lại để có kết quả tương ứng.

| Bài mẫu | STDIN, ký hiệu `\n` là xuống dòng | Điều cần quan sát |
| --- | --- | --- |
| Tổng mảng | `5\n1 2 3 4 5` | Giá trị `sum` thay đổi theo từng phần tử |
| Tìm kiếm nhị phân | `7\n1 3 5 7 9 11 13\n7` | Vùng tìm kiếm và các chỉ số `left`, `right`, `mid` |
| Sắp xếp nổi bọt | `5\n5 3 1 4 2` | So sánh và hoán đổi hai phần tử |
| Giai thừa | `5` | Các tầng gọi hàm và giá trị trả về |

Các bài mảng dùng `arr[10]`: nhập `0 <= n <= 10`. Bài giai thừa dùng `int`: nhập `0 <= n <= 12`.

## STDIN và STDOUT

**STDIN** là dữ liệu chương trình đọc, chẳng hạn qua `cin`. **STDOUT** là đầu ra chương trình in, chẳng hạn qua `cout`; nó khác với bảng biến và thông báo lỗi.

Ví dụ minh họa:

```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
```

STDIN:

```text
3 5
```

STDOUT mong đợi:

```text
8
```

### Hiển thị trong ứng dụng

- API trả đầu ra tổng trong trường `stdout`.
- Trong khi xem trace, `App.tsx` lấy stdout của bước hiện tại; nếu không có snapshot, ứng dụng ghép những sự kiện stdout đến bước đó.
- `ConsolePanel` giữ khoảng trắng và xuống dòng để hiển thị kết quả.
- Khi có lỗi biên dịch hoặc runtime, Console hiện ưu tiên lỗi đó. Giao diện hiện chưa bảo đảm hiển thị đồng thời stdout trước lỗi và thông báo lỗi.
- Không có lệnh in thì Console có thể hiển thị “Không có dữ liệu đầu ra”; điều này không tự động có nghĩa chương trình bị lỗi.

Theo dõi đầy đủ mọi cách xuất dữ liệu trong C++ nằm ngoài phạm vi đã xác nhận. Hãy đối chiếu stdout thực tế khi dùng cú pháp ngoài các bài mẫu.

## AI hỗ trợ học thuật toán

### Trạng thái hiện tại

`ExplanationPanel.tsx` đã có giao diện **AI Giải thích**, ô nhập Gemini API key và các vùng kết quả: tổng quan, độ phức tạp, phân tích chi tiết. Giao diện dự kiến chuyển `code` và `stdout` vào `explainCodeWithAI`.

Tuy nhiên, [`frontend/src/engine/ai.ts`](frontend/src/engine/ai.ts) đang trống tại phiên bản đối chiếu. Hàm `explainCodeWithAI` và kiểu `AIExplanationResult` chưa được cung cấp. Vì vậy **chưa thể kích hoạt AI chỉ bằng cách nhập API key**, và các import liên quan cần được hoàn thiện để build.

Mục giải thích từng bước dựa trên `generateExplanation` là chức năng theo quy tắc, độc lập với dịch vụ AI.

### Hướng hoàn thiện

- [ ] Hiện thực API giải thích và kiểm tra định dạng phản hồi.
- [ ] Giải thích thuật toán, stdout, độ phức tạp thời gian và bộ nhớ dựa trên code được gửi.
- [ ] Thêm timeout, thông báo lỗi và ngăn kết quả cũ ghi đè sau khi code thay đổi.
- [ ] Dùng backend quản lý khóa dịch vụ khi triển khai công khai; không nhúng khóa vào frontend.
- [ ] Cho người dùng biết code và stdout nào sẽ được gửi đến dịch vụ AI.
- [ ] Bổ sung kiểm thử cho lỗi dịch vụ, phản hồi không hợp lệ và các kết luận sai.

Giao diện hiện lưu khóa dưới tên `gemini_api_key` trong `localStorage`; đây không phải kho bí mật an toàn cho khóa dịch vụ dùng chung. Thiết kế này cần được xem xét trước khi hoàn thiện tích hợp.

AI chỉ hỗ trợ giải thích. Đầu ra và trạng thái thực thi phải lấy từ runner; không dùng câu trả lời AI thay thế trace hoặc làm bằng chứng chương trình đúng.

## API và cấu hình

### Các endpoint

| Endpoint | Mục đích |
| --- | --- |
| `GET /api/health` | Kiểm tra backend; khi dùng Docker còn kiểm tra daemon và image |
| `POST /api/execute` | Nhận code C++, stdin và trả kết quả thực thi |

Ví dụ request:

```json
{
  "language": "cpp",
  "code": "#include <iostream>\nint main() { std::cout << 8; return 0; }",
  "stdin": ""
}
```

Phản hồi thực thi có các trường như `success`, `trace`, `stdout`, `stepCount`, `executionTimeMs`; có thể kèm `compilationError`, `runtimeError`, `timeLimitExceeded`, `stepLimitExceeded` hoặc `sandboxWarning`. Một số nhánh lỗi trả ít trường hơn. Cần đọc nội dung JSON, không chỉ dựa vào HTTP 200.

Health thành công trả `status: "ok"` và loại runner. Nếu Docker hoặc image chưa sẵn sàng, health trả HTTP 503. Health thành công chưa chứng minh biên dịch và thu trace đã hoạt động.

### Biến môi trường

| Biến | Nơi sử dụng | Ý nghĩa |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend, lúc build | URL API gồm đuôi `/api` |
| `VITE_API_URL` | Frontend | Tên cũ, được giữ để tương thích |
| `HOST` | Backend | Địa chỉ bind; mặc định `127.0.0.1` |
| `PORT` | Backend | Cổng HTTP; mặc định `3001` |
| `CORS_ORIGINS` | Backend | Các origin cho phép, cách nhau bằng dấu phẩy |
| `NODE_ENV` | Backend | `production` chọn DockerRunner |
| `RUNNER` | Backend | `docker` chọn DockerRunner ngoài production |

Backend hiện đọc `process.env`; không tự động nạp `.env`. Hãy đặt biến trong shell hoặc cấu hình của hosting. Frontend có `.env.production` chứa URL tunnel; cần thay bằng địa chỉ backend thực tế và kiểm tra URL được nhúng vào bản build.

## Triển khai

### Frontend trên GitHub Pages

GitHub Pages phục vụ frontend tĩnh, không chạy Express hoặc biên dịch C++.

1. Chuẩn bị backend có HTTPS và hỗ trợ cơ chế runner của dự án.
2. Đặt `CORS_ORIGINS=https://devk4z.github.io` trên backend. Origin không gồm `/codelens/`.
3. Trong GitHub → **Settings → Secrets and variables → Actions → Variables**, đặt `VITE_API_BASE_URL` thành URL backend thật, gồm `/api`.
4. Chạy workflow **Deploy to GitHub Pages** sau khi build và kiểm thử thành công.
5. Kiểm tra kết nối và chạy một chương trình mẫu trên website vừa triển khai.

Ví dụ định dạng URL: `https://backend.example/api`. Đây chỉ là ví dụ, không phải máy chủ có sẵn. Thay biến Vite phải build lại; chỉ reload trang không thay đổi cấu hình đã đóng gói.

### Backend và Docker

Build TypeScript trong `backend` bằng `npm ci` và `npm run build`; chạy bản build bằng `npm start` với các biến môi trường phù hợp. Nếu triển khai trong container cần nhận kết nối ngoài, đặt `HOST=0.0.0.0`; nếu reverse proxy chạy cùng máy, có thể giữ `127.0.0.1`.

Production cần Docker daemon và image `codelens-sandbox`. Workflow hiện build image bằng:

```bash
docker build -t codelens-sandbox ./runner
```

**Cần thống nhất giao thức trước khi dùng:** DockerRunner hiện gửi JSON chứa `code` và `stdin`, nhưng `runner/run.sh` đọc toàn bộ stdin như mã C++ thuần. Repository còn có `backend/sandbox/`; không coi hai cấu hình này là tương đương. Build image thành công chưa xác nhận chạy code thành công.

Không chuyển API công khai sang LocalRunner để vượt lỗi Docker. Cần kiểm chứng cách ly, giới hạn tài nguyên và dọn container trước khi nhận code không tin cậy.

### Xử lý lỗi thường gặp

| Triệu chứng | Điều cần kiểm tra |
| --- | --- |
| Chưa cấu hình backend | Giá trị `VITE_API_BASE_URL` và bản build đã triển khai |
| HTTP 405 hoặc phản hồi HTML | Request có đang gửi đến trang tĩnh thay vì API không? |
| HTTP 404 | URL có đúng tiền tố `/api` và route không? |
| Không fetch được | Backend có chạy không, HTTPS, URL và CORS; không mặc định mọi lỗi là CORS |
| HTTP 503 từ health | Docker daemon và image `codelens-sandbox` trên máy backend |
| Health thành công nhưng không chạy được code | Giao thức DockerRunner/script, compiler và phản hồi `/execute` |
| AI không hoạt động | Module AI chưa hoàn thiện; nhập key không giải quyết được phần thiếu code |

## Kiểm thử

Từ thư mục `backend`:

```bash
npm ci
npm run build
npm test
npm run test:regression
```

`npm test` đã bao gồm bộ regression; lệnh cuối dùng khi chỉ muốn chạy lại riêng bộ này. Tái tạo trace mẫu bằng `npm run traces` khi thay đổi code/input hoặc instrumentation; không sửa tay `demoTraces.ts` để che lỗi.

Từ thư mục `frontend`:

```bash
npm ci
npm run build
```

Từ thư mục gốc:

```bash
node --test scripts/check-backend.test.mjs
```

Có thể dùng `scripts/check-backend.mjs` với biến `VITE_API_BASE_URL` để kiểm tra health và CORS. Workflow Pages tại phiên bản đối chiếu chưa gọi script này; không mặc định mọi lần deploy đã qua kiểm tra kết nối.

Các lệnh trên là hướng dẫn kiểm tra, không phải tuyên bố phiên bản hiện tại đã vượt qua tất cả kiểm thử.

## Giới hạn hiện tại

- **Lỗi build đang thấy trong mã nguồn:** `backend/src/server.ts`, `frontend/src/engine/api.ts` và `ExplanationPanel.tsx` có chuỗi/template bị hỏng; `App.tsx` còn sử dụng kết quả boolean trong khi `healthCheck` khai báo trả `void`. Cần sửa trước khi phát hành.
- **AI chưa hoàn chỉnh:** file `ai.ts` trống dù giao diện đã import hàm và kiểu từ file này.
- **Docker chưa được xác nhận end-to-end:** giao thức đầu vào giữa runner và script đang không khớp.
- Parser/instrumentation hỗ trợ một tập con C++, không phải toàn bộ ngôn ngữ và STL. Trace ngoài phạm vi đã kiểm thử có thể không đầy đủ.
- LocalRunner mặc định giới hạn chạy 5 giây và bộ đệm output 10 MiB; instrumentation có giới hạn bước. Không diễn giải các giới hạn này thành bảo đảm cách ly an toàn hoặc chống mọi vòng lặp vô hạn.
- Console hiện ưu tiên lỗi thay vì hiển thị đồng thời lỗi và stdout trước lỗi.

### Lộ trình

- [ ] Sửa lỗi build và thống nhất hợp đồng health check.
- [ ] Thống nhất DockerRunner với script sandbox, kiểm thử thực thi end-to-end.
- [ ] Hoàn thiện stdout theo bước và hiển thị stdout cùng lỗi runtime.
- [ ] Hoàn thiện AI giải thích với cách quản lý khóa phù hợp.
- [ ] Bổ sung kiểm thử giao diện desktop/mobile và luồng kết nối lại.
- [ ] Mở rộng trực quan hóa cây, đồ thị và bảng quy hoạch động khi có trace tương ứng.

## Đóng góp

Tạo nhánh riêng, mô tả vấn đề và gửi pull request với thay đổi có thể kiểm chứng. Khi báo lỗi thực thi, hãy kèm đoạn C++ tối giản, stdin, kết quả mong đợi, kết quả thực tế và thông báo lỗi. Không đưa API key hoặc dữ liệu riêng tư vào issue, log hay commit.

README này mô tả những gì mã nguồn thể hiện và các phần còn thiếu; không xác nhận trạng thái hoạt động của backend hay website đang triển khai.
