// The tutor's DSA knowledge, organised by the chapters of the course (L1-L9).
// `ask` is a ladder of guiding questions used in hint mode, from broad to specific.
import { normalize } from './classifier.ts';

export interface Concept {
  id: string;
  name: string;
  aliases: string[];
  chapter: string;
  idea: string;
  steps?: string[];
  complexity?: string;
  pitfalls?: string[];
  ask: string[];
  related?: string[];
}

export const CONCEPTS: Concept[] = [
  {
    id: 'complexity', name: 'Độ phức tạp (Big-O)', chapter: 'L1', aliases: ['big o', 'do phuc tap', 'o n', 'o log n', 'o(n)', 'phan tich thuat toan'],
    idea: 'Big-O mô tả số thao tác cơ bản tăng thế nào khi kích thước dữ liệu n tăng, bỏ qua hằng số và các số hạng nhỏ hơn.',
    steps: ['Chọn thao tác cơ bản (so sánh, gán, phép nhân…).', 'Đếm số lần nó chạy theo n: vòng lặp đơn ~ n, hai vòng lồng nhau ~ n·n, mỗi bước chia đôi ~ log n.', 'Giữ số hạng lớn nhất, bỏ hằng số: 3n² + 5n + 2 → O(n²).'],
    pitfalls: ['Vòng trong phụ thuộc vòng ngoài (j < n - i) vẫn là O(n²) vì tổng n + (n-1) + … + 1 = n(n+1)/2.', 'Phân biệt trường hợp tốt nhất, trung bình và xấu nhất.'],
    ask: ['Thao tác nào được lặp lại nhiều nhất trong code?', 'Vòng lặp ngoài chạy bao nhiêu lần? Mỗi lần đó, vòng trong chạy bao nhiêu lần?', 'Cộng tất cả lại thì được biểu thức nào theo n? Số hạng nào lớn nhất?'],
  },
  {
    id: 'recursion', name: 'Đệ quy', chapter: 'L2', aliases: ['de quy', 'recursion', 'goi lai chinh no', 'truong hop co so', 'base case'],
    idea: 'Hàm đệ quy giải bài toán bằng cách gọi lại chính nó với bài toán nhỏ hơn, cho tới trường hợp cơ sở giải được ngay; kết quả được ghép lại khi các lời gọi lần lượt trả về.',
    steps: ['Xác định trường hợp cơ sở (ví dụ n <= 1).', 'Viết công thức đưa bài toán n về bài toán nhỏ hơn (ví dụ n! = n × (n-1)!).', 'Mỗi lời gọi chiếm một frame trên ngăn xếp; frame chờ lời gọi con trả về rồi mới tính tiếp.'],
    complexity: 'Bằng số lời gọi × chi phí mỗi lời gọi. Bộ nhớ ngăn xếp tỉ lệ với độ sâu đệ quy.',
    pitfalls: ['Thiếu hoặc sai trường hợp cơ sở → đệ quy vô hạn, tràn ngăn xếp.', 'Bài toán con không nhỏ dần.', 'Fibonacci đệ quy thuần tính lại cùng giá trị rất nhiều lần → O(2^n); dùng quy hoạch động để lưu kết quả.'],
    ask: ['Trường hợp nào hàm trả kết quả ngay mà không gọi lại chính nó?', 'Mỗi lần gọi lại, tham số nhỏ đi thế nào?', 'Khi lời gọi con trả về, hàm hiện tại dùng kết quả đó để tính gì?'],
    related: ['backtracking', 'dp'],
  },
  {
    id: 'backtracking', name: 'Quay lui', chapter: 'L2', aliases: ['quay lui', 'backtracking', 'liet ke', 'n quan hau', 'ma di tuan', 'hoan vi', 'to hop', 'day nhi phan'],
    idea: 'Quay lui xây lời giải từng thành phần; ở mỗi bước thử lần lượt các lựa chọn hợp lệ, đi tiếp bằng đệ quy, rồi gỡ lựa chọn để thử cái khác.',
    steps: ['Try(i): với mỗi giá trị v có thể đặt vào vị trí i:', 'nếu v hợp lệ: ghi nhận x[i] = v (đánh dấu đã dùng);', 'nếu i là vị trí cuối thì in/ghi nhận lời giải, ngược lại gọi Try(i+1);', 'gỡ đánh dấu (quay lui) để thử giá trị tiếp theo.'],
    complexity: 'Thường là hàm mũ hoặc giai thừa (2^n dãy nhị phân, n! hoán vị); cắt nhánh sớm giúp giảm đáng kể.',
    pitfalls: ['Quên gỡ đánh dấu sau khi gọi đệ quy.', 'Kiểm tra hợp lệ quá muộn (sau khi đã đi sâu).'],
    ask: ['Lời giải gồm những thành phần nào, được điền theo thứ tự nào?', 'Tại vị trí đang xét có những lựa chọn nào, lựa chọn nào bị cấm?', 'Sau khi thử xong một lựa chọn, cần trả lại trạng thái gì?'],
    related: ['recursion'],
  },
  {
    id: 'dp', name: 'Quy hoạch động', chapter: 'L3.1', aliases: ['quy hoach dong', 'dynamic programming', 'dp', 'bang phuong an', 'luu tru nghiem', 'bottom up', 'top down', 'memo'],
    idea: 'Chia bài toán thành các bài toán con chồng lặp, giải mỗi bài toán con một lần và lưu kết quả vào bảng; ô mới được tính từ các ô đã có.',
    steps: ['Định nghĩa trạng thái: dp[i] (hoặc dp[i][j]) nghĩa là gì.', 'Tìm công thức truy hồi từ các trạng thái nhỏ hơn.', 'Khởi tạo trường hợp cơ sở.', 'Điền bảng theo thứ tự sao cho ô cần dùng đã được tính; đáp án nằm ở ô cuối hoặc max của bảng.'],
    complexity: 'Số trạng thái × chi phí tính mỗi trạng thái (ví dụ LCS: O(m·n)).',
    pitfalls: ['Định nghĩa trạng thái mơ hồ → công thức sai.', 'Điền bảng sai thứ tự, dùng ô chưa tính.', 'Quên trường hợp cơ sở ở hàng/cột đầu.'],
    ask: ['dp[i] (hoặc dp[i][j]) lưu đáp án của bài toán con nào?', 'Để tính ô hiện tại, cần biết những ô nào trước đó?', 'Ô nào có đáp án ngay mà không cần tính (trường hợp cơ sở)?'],
    related: ['lis', 'knapsack', 'lcs', 'recursion'],
  },
  {
    id: 'lis', name: 'Dãy con tăng dài nhất (LIS)', chapter: 'L3.1', aliases: ['lis', 'day con tang dai nhat', 'longest increasing'],
    idea: 'L[i] là độ dài dãy con tăng dài nhất kết thúc tại a[i]; L[i] = 1 + max L[j] với j < i và a[j] < a[i].',
    complexity: 'O(n²) với cách quy hoạch động cơ bản.',
    pitfalls: ['Đáp án là max của mọi L[i], không phải L[n-1].', 'Dãy con không cần liên tiếp.'],
    ask: ['Nếu dãy con tăng phải kết thúc tại a[i], phần tử đứng ngay trước nó có thể là những a[j] nào?', 'Trong các a[j] đó nên chọn cái nào để dãy dài nhất?', 'Vì sao đáp án là giá trị lớn nhất trong cả bảng?'],
    related: ['dp'],
  },
  {
    id: 'knapsack', name: 'Bài toán ba lô 0/1', chapter: 'L3.1', aliases: ['ba lo', 'knapsack', 'cai tui'],
    idea: 'F[i][w] là giá trị lớn nhất khi chỉ dùng i đồ vật đầu với sức chứa w: không lấy đồ i thì F[i-1][w], lấy thì F[i-1][w - w_i] + v_i (nếu vừa).',
    complexity: 'O(n·W) thời gian và bộ nhớ.',
    pitfalls: ['Mỗi đồ vật chỉ được lấy một lần nên phải dùng hàng i-1, không dùng hàng i.', 'Tham lam theo tỉ lệ giá trị/khối lượng không cho đáp án đúng với ba lô 0/1.'],
    ask: ['Với đồ vật thứ i và sức chứa w, có mấy lựa chọn?', 'Nếu lấy đồ vật i thì còn lại sức chứa bao nhiêu cho các đồ trước?', 'Vì sao phải đọc từ hàng i-1 chứ không phải hàng i?'],
    related: ['dp', 'greedy'],
  },
  {
    id: 'lcs', name: 'Xâu con chung dài nhất (LCS)', chapter: 'L3.1', aliases: ['lcs', 'xau con chung', 'day con chung'],
    idea: 'L[i][j] là độ dài LCS của i ký tự đầu của X và j ký tự đầu của Y: nếu X[i] = Y[j] thì L[i-1][j-1] + 1, ngược lại max(L[i-1][j], L[i][j-1]).',
    complexity: 'O(m·n).',
    pitfalls: ['Lệch chỉ số giữa xâu (bắt đầu từ 0) và bảng (hàng/cột 0 là xâu rỗng).'],
    ask: ['Nếu hai ký tự cuối bằng nhau, LCS liên quan gì tới LCS của hai xâu bỏ ký tự cuối?', 'Nếu khác nhau thì có thể bỏ ký tự cuối của xâu nào?', 'Hàng 0 và cột 0 của bảng mang ý nghĩa gì?'],
    related: ['dp'],
  },
  {
    id: 'greedy', name: 'Tham lam', chapter: 'L3.2', aliases: ['tham lam', 'greedy', 'chon hoat dong', 'doi tien', 'cuoc hop'],
    idea: 'Ở mỗi bước chọn phương án tốt nhất ngay lúc đó và không quay lại. Chỉ đúng khi bài toán có tính chất lựa chọn tham lam (chứng minh được).',
    steps: ['Sắp xếp theo tiêu chí tham lam (ví dụ thời điểm kết thúc sớm nhất cho bài chọn hoạt động).', 'Duyệt, chọn phần tử nếu không mâu thuẫn với các lựa chọn trước.'],
    complexity: 'Thường O(n log n) do bước sắp xếp.',
    pitfalls: ['Tham lam không phải lúc nào cũng tối ưu: đổi tiền với hệ xu bất thường (ví dụ có xu 400) có thể cho nhiều xu hơn đáp án tối ưu.'],
    ask: ['Ở mỗi bước, tiêu chí "tốt nhất" là gì?', 'Có ví dụ nào mà lựa chọn tốt nhất trước mắt lại làm hỏng kết quả cuối không?', 'Sắp xếp theo tiêu chí nào thì việc chọn trở nên đơn giản?'],
    related: ['dp', 'knapsack'],
  },
  {
    id: 'linked-list', name: 'Danh sách liên kết đơn', chapter: 'L4', aliases: ['danh sach lien ket', 'dslk', 'linked list', 'node', 'nut', 'pnext', 'con tro next'],
    idea: 'Mỗi nút chứa dữ liệu và con trỏ tới nút kế tiếp; danh sách giữ con trỏ pHead (và thường pTail). Chèn/xóa không cần dời phần tử như mảng.',
    steps: ['Chèn đầu: p->next = head; head = p.', 'Chèn cuối: tail->next = p; tail = p (danh sách rỗng thì head = tail = p).', 'Xóa sau q: p = q->next; q->next = p->next; delete p.'],
    complexity: 'Chèn/xóa đầu O(1); tìm kiếm và truy cập phần tử thứ k O(n).',
    pitfalls: ['Quên trường hợp danh sách rỗng hoặc chỉ có một nút.', 'Đổi thứ tự gán con trỏ làm mất phần còn lại của danh sách.', 'Không cập nhật tail khi xóa nút cuối.'],
    ask: ['Trước thao tác, các con trỏ đang trỏ vào đâu? Hãy vẽ ra.', 'Nên gán con trỏ nào trước để không làm mất phần sau của danh sách?', 'Nếu danh sách rỗng thì đoạn code này còn đúng không?'],
    related: ['doubly-linked', 'stack', 'queue'],
  },
  {
    id: 'doubly-linked', name: 'DSLK đôi và DSLK vòng', chapter: 'L4', aliases: ['dslk doi', 'danh sach lien ket doi', 'pprev', 'doubly', 'dslk vong', 'danh sach vong', 'circular'],
    idea: 'DSLK đôi: mỗi nút có cả next và prev nên đi được hai chiều. DSLK vòng: nút cuối trỏ về nút đầu, không có nút nào trỏ NULL.',
    pitfalls: ['DSLK đôi: chèn/xóa phải sửa đủ 4 con trỏ (2 chiều × 2 phía).', 'DSLK vòng: điều kiện dừng khi duyệt là quay lại nút xuất phát, không phải gặp NULL.'],
    ask: ['Khi chèn một nút vào giữa, những con trỏ nào cần đổi?', 'Duyệt danh sách vòng thì dừng khi nào?'],
    related: ['linked-list'],
  },
  {
    id: 'stack', name: 'Ngăn xếp (Stack)', chapter: 'L5', aliases: ['stack', 'ngan xep', 'push', 'pop', 'lifo', 'top'],
    idea: 'Vào sau ra trước (LIFO): chỉ thêm (push) và lấy (pop) ở đỉnh. Dùng để khử đệ quy, đổi cơ số, kiểm tra ngoặc, lượng giá biểu thức hậu tố.',
    complexity: 'push/pop/top đều O(1).',
    pitfalls: ['Pop khi stack rỗng; push khi stack mảng đã đầy.', 'Đổi cơ số bằng stack: các chữ số lấy ra theo thứ tự ngược với lúc đưa vào.'],
    ask: ['Phần tử nào được lấy ra trước: cái vào sớm nhất hay muộn nhất?', 'Trước khi pop cần kiểm tra điều gì?', 'Bài toán này cần đảo ngược thứ tự ở đâu, vì sao stack hợp?'],
    related: ['queue', 'postfix', 'recursion'],
  },
  {
    id: 'queue', name: 'Hàng đợi (Queue)', chapter: 'L5', aliases: ['queue', 'hang doi', 'enqueue', 'dequeue', 'fifo', 'mang vong'],
    idea: 'Vào trước ra trước (FIFO): thêm ở cuối, lấy ở đầu. Cài bằng mảng vòng (front, rear quay vòng theo % n) hoặc DSLK.',
    complexity: 'enqueue/dequeue O(1).',
    pitfalls: ['Mảng vòng: phân biệt hàng đợi rỗng và đầy (thường bỏ trống một ô hoặc đếm số phần tử).', 'Quên lấy % kích thước khi tăng front/rear.'],
    ask: ['Phần tử nào ra trước?', 'Khi rear chạm cuối mảng nhưng đầu mảng còn trống thì làm sao tận dụng?', 'Làm sao phân biệt hàng đợi rỗng với hàng đợi đầy?'],
    related: ['stack'],
  },
  {
    id: 'postfix', name: 'Biểu thức trung tố, hậu tố, tiền tố', chapter: 'L5', aliases: ['hau to', 'postfix', 'trung to', 'infix', 'tien to', 'prefix', 'ky phap ba lan', 'luong gia bieu thuc'],
    idea: 'Hậu tố đặt toán tử sau toán hạng (a b +), không cần ngoặc. Lượng giá: gặp số thì push, gặp toán tử thì pop hai số, tính, push kết quả. Chuyển trung tố → hậu tố dùng stack toán tử theo độ ưu tiên.',
    pitfalls: ['Pop hai toán hạng: số lấy ra trước là toán hạng phải (quan trọng với - và /).', 'Khi chuyển đổi, toán tử trên đỉnh có độ ưu tiên ≥ toán tử mới phải được đưa ra trước.'],
    ask: ['Gặp một toán tử thì cần những gì đã có trên stack?', 'Hai số pop ra theo thứ tự nào, số nào đứng bên trái phép trừ?', 'Khi gặp dấu ")" thì phải làm gì với stack toán tử?'],
    related: ['stack'],
  },
  {
    id: 'binary-tree', name: 'Cây nhị phân và phép duyệt', chapter: 'L6', aliases: ['cay nhi phan', 'cay', 'tree', 'duyet cay', 'nlr', 'lnr', 'lrn', 'tien tu', 'trung tu', 'hau tu', 'chieu cao cay', 'nut la'],
    idea: 'Mỗi nút có tối đa hai con. Duyệt NLR (gốc-trái-phải), LNR (trái-gốc-phải), LRN (trái-phải-gốc) đều viết tự nhiên bằng đệ quy.',
    steps: ['Đếm nút: 1 + đếm(trái) + đếm(phải), cây rỗng = 0.', 'Chiều cao: 1 + max(cao(trái), cao(phải)).'],
    complexity: 'Duyệt toàn cây O(n).',
    pitfalls: ['Quên trường hợp cây rỗng (NULL) làm điểm dừng đệ quy.'],
    ask: ['Với cây rỗng, kết quả nên là gì?', 'Kết quả của cả cây ghép từ kết quả của hai cây con thế nào?', 'Trong LNR, nút gốc được thăm vào lúc nào so với hai cây con?'],
    related: ['bst', 'recursion'],
  },
  {
    id: 'bst', name: 'Cây nhị phân tìm kiếm (BST)', chapter: 'L6', aliases: ['bst', 'cay nhi phan tim kiem', 'binary search tree', 'xoa nut', 'the mang', 'phan tu the mang'],
    idea: 'Mọi khóa ở cây con trái nhỏ hơn gốc, cây con phải lớn hơn gốc. Tìm/chèn đi trái hay phải theo so sánh. Duyệt LNR cho dãy tăng dần.',
    steps: ['Xóa nút lá: bỏ luôn.', 'Xóa nút có một con: nối con lên thay.', 'Xóa nút có hai con: thay bằng phần tử thế mạng (lớn nhất cây trái hoặc nhỏ nhất cây phải) rồi xóa phần tử đó.'],
    complexity: 'O(h) với h là chiều cao: O(log n) khi cây cân bằng, O(n) khi cây lệch (chèn dãy đã sắp xếp).',
    pitfalls: ['Chèn dãy tăng dần tạo cây lệch thành danh sách.', 'Xóa nút hai con mà quên xóa phần tử thế mạng.'],
    ask: ['Khóa cần tìm nhỏ hơn gốc thì nó chỉ có thể nằm ở đâu?', 'Nút cần xóa có mấy con?', 'Phần tử nào có thể thay vào chỗ nút bị xóa mà vẫn giữ đúng tính chất BST?'],
    related: ['binary-tree', 'binary-search'],
  },
  {
    id: 'interchange-sort', name: 'Đổi chỗ trực tiếp (Interchange Sort)', chapter: 'L7', aliases: ['interchange', 'doi cho truc tiep'],
    idea: 'Với mỗi vị trí i, so sánh a[i] với mọi a[j] phía sau; gặp cặp nghịch thế (a[j] < a[i]) thì đổi chỗ ngay.',
    complexity: 'O(n²) phép so sánh trong mọi trường hợp.',
    ask: ['Sau khi xong vị trí i, a[i] chứa phần tử nào?', 'Thế nào là một cặp nghịch thế?'],
    related: ['selection-sort', 'bubble-sort'],
  },
  {
    id: 'selection-sort', name: 'Chọn trực tiếp (Selection Sort)', chapter: 'L7', aliases: ['selection sort', 'chon truc tiep', 'sap xep chon'],
    idea: 'Ở lượt i, tìm phần tử nhỏ nhất trong a[i..n-1] rồi đổi nó về vị trí i. Phần đầu mảng luôn đã sắp xếp.',
    complexity: 'O(n²) so sánh, nhưng chỉ tối đa n-1 lần đổi chỗ.',
    pitfalls: ['Đổi chỗ trong vòng tìm min thay vì đổi một lần sau khi tìm xong.'],
    ask: ['Sau lượt i, những vị trí nào đã đúng chỗ cuối cùng?', 'Cần nhớ giá trị nhỏ nhất hay vị trí của nó? Vì sao?'],
    related: ['interchange-sort', 'insertion-sort'],
  },
  {
    id: 'bubble-sort', name: 'Nổi bọt (Bubble Sort)', chapter: 'L7', aliases: ['bubble sort', 'noi bot', 'sap xep noi bot'],
    idea: 'Duyệt, so sánh từng cặp kề nhau và đổi chỗ nếu sai thứ tự; sau mỗi lượt phần tử lớn nhất còn lại "nổi" về cuối nên lượt sau xét ít hơn một phần tử.',
    complexity: 'O(n²); O(n) ở trường hợp tốt nhất nếu dừng sớm khi một lượt không có lần đổi chỗ nào.',
    pitfalls: ['Vòng trong phải dừng ở n - 1 - i để không so sánh a[j+1] ngoài mảng.'],
    ask: ['Sau lượt đầu tiên, phần tử nào chắc chắn đã đúng chỗ?', 'Vì sao vòng trong chỉ chạy tới n - 1 - i?', 'Nếu một lượt không đổi chỗ lần nào, ta biết gì về mảng?'],
    related: ['selection-sort', 'insertion-sort'],
  },
  {
    id: 'insertion-sort', name: 'Chèn trực tiếp (Insertion Sort)', chapter: 'L7', aliases: ['insertion sort', 'chen truc tiep', 'sap xep chen'],
    idea: 'Coi a[0..i-1] đã sắp xếp; lấy x = a[i], dời các phần tử lớn hơn x sang phải một ô rồi đặt x vào chỗ trống.',
    complexity: 'O(n²) xấu nhất, O(n) khi mảng gần như đã sắp xếp.',
    pitfalls: ['Không lưu x trước khi dời sẽ bị ghi đè mất.', 'Điều kiện vòng dời phải kiểm tra j >= 0 trước khi đọc a[j].'],
    ask: ['Trước khi dời, vì sao phải cất a[i] vào biến x?', 'Dời tới khi nào thì dừng?', 'Phần nào của mảng luôn đã sắp xếp?'],
    related: ['selection-sort', 'bubble-sort'],
  },
  {
    id: 'quick-sort', name: 'Quick Sort', chapter: 'L8', aliases: ['quick sort', 'quicksort', 'phan hoach', 'pivot', 'chot'],
    idea: 'Chọn chốt (pivot), phân hoạch để bên trái ≤ chốt, bên phải ≥ chốt, rồi sắp xếp đệ quy hai phần.',
    steps: ['i đi từ trái tìm phần tử ≥ pivot, j đi từ phải tìm phần tử ≤ pivot.', 'Nếu i <= j thì đổi chỗ a[i], a[j], i++, j--.', 'Lặp tới khi i > j, rồi gọi đệ quy cho [left..j] và [i..right].'],
    complexity: 'Trung bình O(n log n); xấu nhất O(n²) khi chốt luôn là min/max (ví dụ chọn phần tử đầu với mảng đã sắp xếp). Chọn chốt ngẫu nhiên hoặc ở giữa giảm khả năng này.',
    pitfalls: ['Điều kiện dừng phân hoạch sai (i < j thay vì i <= j) gây lặp vô hạn hoặc bỏ sót.'],
    ask: ['Sau khi phân hoạch xong, chốt và các phần tử hai bên có quan hệ gì?', 'Nếu chốt luôn là phần tử nhỏ nhất thì hai phần lớn bao nhiêu?', 'Vì sao chọn chốt ở giữa hoặc ngẫu nhiên lại an toàn hơn?'],
    related: ['merge-sort', 'stack'],
  },
  {
    id: 'merge-sort', name: 'Merge Sort', chapter: 'L8', aliases: ['merge sort', 'mergesort', 'tron', 'sap xep tron', 'chia de tri'],
    idea: 'Chia đôi mảng, sắp xếp đệ quy từng nửa, rồi trộn hai nửa đã sắp xếp bằng cách liên tục lấy phần tử nhỏ hơn ở đầu hai nửa.',
    complexity: 'O(n log n) trong mọi trường hợp; cần O(n) bộ nhớ phụ cho bước trộn.',
    pitfalls: ['Khi trộn, quên chép phần còn dư của một nửa sau khi nửa kia đã hết.', 'Tính mid sai làm một nửa rỗng và đệ quy không dừng.'],
    ask: ['Mảng một phần tử thì đã sắp xếp chưa?', 'Trộn hai dãy đã sắp xếp: phần tử nhỏ nhất của kết quả nằm ở đâu?', 'Có bao nhiêu tầng chia đôi, mỗi tầng tốn bao nhiêu công trộn?'],
    related: ['quick-sort', 'recursion'],
  },
  {
    id: 'heap-sort', name: 'Heap Sort', chapter: 'L7', aliases: ['heap sort', 'heap', 'max heap', 'vun dong'],
    idea: 'Xây max-heap (cha ≥ con) trên mảng, rồi lặp: đổi gốc (lớn nhất) với phần tử cuối, thu nhỏ heap và vun lại.',
    complexity: 'O(n log n), sắp xếp tại chỗ.',
    ask: ['Trong max-heap, phần tử lớn nhất nằm ở đâu?', 'Con của nút i trong mảng nằm ở vị trí nào?'],
    related: ['quick-sort', 'merge-sort'],
  },
  {
    id: 'linear-search', name: 'Tìm kiếm tuần tự', chapter: 'L9', aliases: ['tim kiem tuan tu', 'linear search', 'tim tuyen tinh', 'tim max', 'phan tu lon nhat'],
    idea: 'Duyệt lần lượt từng phần tử cho tới khi gặp giá trị cần tìm (hoặc hết mảng). Tìm max/min cũng là duyệt một lượt và giữ giá trị tốt nhất đã thấy.',
    complexity: 'O(n): xấu nhất xét hết n phần tử, trung bình khoảng n/2 khi phần tử có trong mảng.',
    pitfalls: ['Khởi tạo max bằng 0 sai khi mảng toàn số âm; nên khởi tạo bằng a[0].'],
    ask: ['Trường hợp xấu nhất phải xét bao nhiêu phần tử?', 'Biến lưu kết quả nên khởi tạo bằng gì?'],
    related: ['binary-search'],
  },
  {
    id: 'binary-search', name: 'Tìm kiếm nhị phân', chapter: 'L9', aliases: ['tim kiem nhi phan', 'binary search', 'chia doi', 'tha trung'],
    idea: 'Trên mảng đã sắp xếp, so sánh phần tử giữa vùng [left..right] với giá trị cần tìm rồi loại một nửa; vùng tìm rỗng (left > right) thì không có.',
    steps: ['mid = left + (right - left) / 2.', 'a[mid] == x: tìm thấy.', 'a[mid] < x: left = mid + 1, ngược lại right = mid - 1.'],
    complexity: 'O(log n): mỗi bước vùng tìm còn một nửa, khoảng log₂n + 1 lần so sánh.',
    pitfalls: ['Chỉ đúng khi mảng đã sắp xếp.', 'Viết left = mid hoặc right = mid có thể lặp vô hạn.', '(left + right) / 2 có thể tràn số với chỉ số lớn; dùng left + (right - left) / 2.'],
    ask: ['Vì sao mảng phải đã sắp xếp?', 'Nếu a[mid] nhỏ hơn giá trị cần tìm, các phần tử nào chắc chắn không phải đáp án?', 'Sau mỗi lần so sánh vùng tìm còn bao nhiêu phần tử? Vậy cần khoảng bao nhiêu lần?'],
    related: ['linear-search', 'bst'],
  },
  {
    id: 'hashing', name: 'Bảng băm', chapter: 'L9', aliases: ['bang bam', 'hash', 'ham bam', 'hashtable', 'dung do', 'collision'],
    idea: 'Hàm băm đổi khóa thành chỉ số ngăn; tra cứu đi thẳng tới ngăn đó. Hai khóa cùng ngăn là đụng độ, xử lý bằng nối chuỗi (mỗi ngăn một danh sách) hoặc dò địa chỉ mở.',
    complexity: 'Trung bình O(1) cho thêm/tìm/xóa nếu hàm băm phân bố đều; xấu nhất O(n) khi mọi khóa vào cùng ngăn.',
    pitfalls: ['Hàm băm phân bố kém làm nhiều khóa dồn vào ít ngăn.'],
    ask: ['Với khóa này, hàm băm cho ra ngăn số mấy?', 'Hai khóa vào cùng một ngăn thì lưu thế nào?'],
    related: ['linear-search'],
  },
  {
    id: 'two-pointers', name: 'Hai con trỏ', chapter: 'Kỹ thuật', aliases: ['hai con tro', 'two pointers', 'hai dau', 'palindrome', 'doi xung'],
    idea: 'Hai chỉ số đi từ hai đầu (hoặc cùng chiều với tốc độ khác nhau); mỗi bước di chuyển một chỉ số để loại bớt phần tử, nên chỉ duyệt mảng một lần.',
    complexity: 'O(n).',
    pitfalls: ['Điều kiện dừng left < right hay left <= right tùy bài; sai sẽ thiếu hoặc thừa một phần tử ở giữa.'],
    ask: ['Mỗi bước, con trỏ nào được di chuyển và vì sao?', 'Khi hai con trỏ gặp nhau thì đã xét hết chưa?'],
    related: ['binary-search'],
  },
  {
    id: 'array-index', name: 'Mảng và chỉ số', chapter: 'Kỹ thuật', aliases: ['mang', 'chi so', 'array', 'ngoai mang', 'tran mang', 'off by one', 'lech mot'],
    idea: 'Mảng n phần tử có chỉ số hợp lệ từ 0 tới n-1. Truy cập a[n] hay a[-1] là hành vi không xác định trong C++: có thể ra số rác hoặc crash.',
    pitfalls: ['Vòng for (i = 0; i <= n; i++) đọc tới a[n].', 'Biến cục bộ chưa khởi tạo chứa giá trị rác.', 'Tràn số int khi giá trị vượt khoảng 2.1 tỉ.'],
    ask: ['Mảng có mấy phần tử, chỉ số lớn nhất hợp lệ là bao nhiêu?', 'Ở lần lặp cuối, chỉ số đang là bao nhiêu?'],
  },
];

// Maps detected algorithms (engine/insight.ts) to the matching concept.
export const ALGORITHM_CONCEPT: Record<string, string> = {
  'binary-search': 'binary-search', 'bubble-sort': 'bubble-sort', dp: 'dp', 'two-pointers': 'two-pointers',
  recursion: 'recursion', 'max-min': 'linear-search', accumulate: 'array-index',
};

// The concept a question names, preferring the longest alias ("dslk doi" over "dslk").
export function findConcept(question: string): Concept | undefined {
  const text = ` ${normalize(question)} `;
  let best: { concept: Concept; length: number } | undefined;
  for (const concept of CONCEPTS) for (const alias of concept.aliases) {
    const a = normalize(alias);
    if (text.includes(` ${a} `) && (!best || a.length > best.length)) best = { concept, length: a.length };
  }
  return best?.concept;
}

// Every concept a question names, in the order they appear ("stack khác queue" → stack, queue).
export function findConcepts(question: string): Concept[] {
  const text = ` ${normalize(question)} `;
  const found: { concept: Concept; at: number }[] = [];
  for (const concept of CONCEPTS) {
    const positions = concept.aliases.map(a => text.indexOf(` ${normalize(a)} `)).filter(p => p >= 0);
    if (positions.length) found.push({ concept, at: Math.min(...positions) });
  }
  return found.sort((a, b) => a.at - b.at).map(f => f.concept);
}

export const conceptById = (id: string | undefined) => CONCEPTS.find(c => c.id === id);
