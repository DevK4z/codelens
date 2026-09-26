export interface ExerciseSource {
  filename: string;
  sha256: string;
}

export interface ExerciseItem {
  id: string;
  chapter: string;
  title: string;
  source_file: string;
  pdf_pages: number[];
  kind: 'G' | 'V' | 'R';
  statement: string;
  source_data: string;
  notes: string;
  constraints?: string;
  proposed_input?: string;
  proposed_output?: string;
  hints?: string[];
  solution_code?: string;
  solution_stdin?: string;
  suggestedRoles?: Record<string, string>;
}

export const EXERCISES: ExerciseItem[] = [
  {
    "id": "L2-02",
    "chapter": "L2",
    "title": "Giai thừa bằng đệ quy",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      6
    ],
    "kind": "V",
    "statement": "Tính n! bằng đệ quy với trường hợp cơ sở n=0 trả 1.",
    "source_data": "Mã gốc: n * GiaiThua(n-1).",
    "notes": "Dòng công thức ghi n>1 nhưng code xử lý cả n=1; nếu chuẩn hóa phát biểu phải ghi rõ."
  },
  {
    "id": "L2-03",
    "chapter": "L2",
    "title": "Dãy Fibonacci",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      7
    ],
    "kind": "V",
    "statement": "Tính số Fibonacci bằng đệ quy; quan sát cây lời gọi và các bài toán con lặp lại.",
    "source_data": "Bài toán thỏ: thỏ không chết; hai tháng sau khi ra đời bắt đầu sinh một cặp, mỗi tháng tiếp theo sinh thêm một cặp. Hỏi số cặp ở tháng n từ một cặp ban đầu. Công thức in trên slide: F(0)=F(1)=1, F(n)=F(n-1)+F(n-2) với n>1.",
    "notes": "Giữ quy ước chỉ số/cơ sở theo hình nguồn; không trộn các quy ước Fibonacci của các chương."
  },
  {
    "id": "L2-04",
    "chapter": "L2",
    "title": "Tháp Hà Nội",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      8,
      9
    ],
    "kind": "V",
    "statement": "Di chuyển n đĩa từ một cọc sang cọc khác với cọc trung gian; mỗi lần di chuyển một đĩa, không đặt đĩa lớn lên đĩa nhỏ.",
    "source_data": "Ban đầu các đĩa nằm trên một cọc.",
    "notes": "Các quy tắc và lời giải minh họa bằng ảnh."
  },
  {
    "id": "L2-05",
    "chapter": "L2",
    "title": "Đệ quy hỗ tương X và Y",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      10
    ],
    "kind": "V",
    "statement": "Tính hai dãy bằng các hàm gọi lẫn nhau.",
    "source_data": "X0=1; Y0=1; Xn=X(n-1)+Y(n-1); Yn=2*X(n-1)*Y(n-1).",
    "notes": ""
  },
  {
    "id": "L2-06",
    "chapter": "L2",
    "title": "Liệt kê dãy nhị phân",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      17
    ],
    "kind": "G",
    "statement": "Liệt kê tất cả dãy nhị phân độ dài n.",
    "source_data": "n=3: 000,001,010,011,100,101,110,111.",
    "notes": "",
    "constraints": "n <= 20",
    "proposed_input": "3",
    "proposed_output": "000\\n001\\n010\\n011\\n100\\n101\\n110\\n111",
    "solution_stdin": "3",
    "solution_code": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, vector<int>& a, int i) {\\n    if (i == n) {\\n        for (int x : a) cout << x;\\n        cout << \"\\\\n\";\\n        return;\\n    }\\n    a[i] = 0;\\n    gen(n, a, i + 1);\\n    a[i] = 1;\\n    gen(n, a, i + 1);\\n}\\n\\nint main() {\\n    int n;\\n    if (cin >> n) {\\n        vector<int> a(n);\\n        gen(n, a, 0);\\n    }\\n    return 0;\\n}"
  },
  {
    "id": "L2-07",
    "chapter": "L2",
    "title": "Liệt kê hoán vị",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      18
    ],
    "kind": "G",
    "statement": "Liệt kê tất cả hoán vị độ dài n của các số 1..n.",
    "source_data": "n=3: 123,132,213,231,312,321. Dùng mảng đánh dấu các số đã chọn.",
    "notes": "",
    "constraints": "n <= 10",
    "proposed_input": "3",
    "proposed_output": "123\\n132\\n213\\n231\\n312\\n321",
    "solution_stdin": "3",
    "solution_code": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, vector<int>& a, vector<bool>& used, int i) {\\n    if (i == n) {\\n        for (int x : a) cout << x;\\n        cout << \"\\\\n\";\\n        return;\\n    }\\n    for (int v = 1; v <= n; v++) {\\n        if (!used[v]) {\\n            used[v] = true;\\n            a[i] = v;\\n            gen(n, a, used, i + 1);\\n            used[v] = false;\\n        }\\n    }\\n}\\n\\nint main() {\\n    int n;\\n    if (cin >> n) {\\n        vector<int> a(n);\\n        vector<bool> used(n + 1, false);\\n        gen(n, a, used, 0);\\n    }\\n    return 0;\\n}"
  },
  {
    "id": "L2-08",
    "chapter": "L2",
    "title": "Liệt kê tổ hợp",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      19
    ],
    "kind": "G",
    "statement": "Liệt kê các tổ hợp chập k của n phần tử.",
    "source_data": "n=5, k=3. Điều kiện tăng x1<x2<...<xk.",
    "notes": "Danh sách minh họa trên slide thiếu 134,135,145; không dùng danh sách thiếu làm đáp án đầy đủ.",
    "constraints": "k <= n <= 20",
    "proposed_input": "5 3",
    "proposed_output": "123\\n124\\n125\\n134\\n135\\n145\\n234\\n235\\n245\\n345",
    "solution_stdin": "5 3",
    "solution_code": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, int k, vector<int>& a, int i) {\\n    if (i > k) {\\n        for (int j = 1; j <= k; j++) cout << a[j];\\n        cout << \"\\\\n\";\\n        return;\\n    }\\n    for (int v = a[i-1] + 1; v <= n - k + i; v++) {\\n        a[i] = v;\\n        gen(n, k, a, i + 1);\\n    }\\n}\\n\\nint main() {\\n    int n, k;\\n    if (cin >> n >> k) {\\n        vector<int> a(k + 1);\\n        a[0] = 0;\\n        gen(n, k, a, 1);\\n    }\\n    return 0;\\n}"
  },
  {
    "id": "L2-09",
    "chapter": "L2",
    "title": "Xếp N quân hậu",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      20,
      21,
      22,
      23,
      24,
      25
    ],
    "kind": "G",
    "statement": "Xếp n quân hậu trên bàn cờ n×n sao cho không quân nào ăn được quân nào.",
    "source_data": "Theo dõi cột, đường chéo tổng chỉ số và đường chéo hiệu chỉ số.",
    "notes": ""
  },
  {
    "id": "L2-10",
    "chapter": "L2",
    "title": "Các tập con có tổng bằng M",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      26
    ],
    "kind": "G",
    "statement": "Cho dãy số nguyên a1,...,an với n<100 và số nguyên dương M. Tìm tất cả tập con của dãy có tổng bằng M.",
    "source_data": "",
    "notes": "Không tự giả định các ai đều dương. Slide chưa quy định xử lý các phần tử bằng nhau theo giá trị hay theo vị trí."
  },
  {
    "id": "L2-11",
    "chapter": "L2",
    "title": "Mã đi tuần",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      26,
      27,
      28
    ],
    "kind": "G",
    "statement": "Tìm hiểu bài toán Mã đi tuần, nghiên cứu thuật toán và viết chương trình.",
    "source_data": "dX={-1,-2,-2,-1,1,2,2,1}; dY={-2,-1,1,2,2,1,-1,-2}.",
    "notes": "Đề không chỉ định kích thước bàn cờ, ô xuất phát hoặc chu trình kín; cần ghi giả định khi triển khai."
  },
  {
    "id": "L2-12",
    "chapter": "L2",
    "title": "Chia dãy thành hai dãy con tổng bằng nhau",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      29
    ],
    "kind": "G",
    "statement": "Cho dãy A gồm N số nguyên. Cho biết có thể chia A thành hai dãy con có tổng bằng nhau hay không.",
    "source_data": "",
    "notes": "Nguồn không nói hai dãy con phải liên tiếp; không tự biến thành bài cắt một vị trí trong mảng."
  },
  {
    "id": "L2-13",
    "chapter": "L2",
    "title": "Chuột đi trong mê cung",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      29
    ],
    "kind": "G",
    "statement": "Cho mê cung N×N: ô 0 được đi, ô 1 bị cấm. Tìm đường từ [1,1] đến [N,N] nếu có. Mỗi bước đi sang một trong bốn ô kề không bị cấm.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L2-14",
    "chapter": "L2",
    "title": "Liệt kê phân tích số nguyên",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [
      30
    ],
    "kind": "G",
    "statement": "Cho N nguyên dương. Liệt kê các cách phân tích N thành tổng các số nguyên nhỏ hơn hoặc bằng N; các hoán vị chỉ tính một lần.",
    "source_data": "N=6; ảnh nguồn liệt kê 11 cách.",
    "notes": "Các số hạng trong ví dụ đều nguyên dương. Nếu bổ sung điều kiện này vào đề chuẩn hóa, ghi rõ nhằm loại bỏ cách hiểu có số âm/0."
  },
  {
    "id": "L3.1-01",
    "chapter": "L3.1",
    "title": "Đếm phân tích số nguyên - bottom-up",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      13,
      14,
      15,
      16,
      17
    ],
    "kind": "G",
    "statement": "Cho số tự nhiên n<=400, đếm cách phân tích thành tổng số nguyên dương, không phân biệt thứ tự. Cài đặt bằng C++ và test theo yêu cầu lập trình cặp đôi.",
    "source_data": "n=0 có 1 cách (tổng rỗng); n=5 có 7 cách. f(m,v)=f(m-1,v)+f(m,v-m) khi v>=m, ngược lại f(m-1,v).",
    "notes": ""
  },
  {
    "id": "L3.1-02",
    "chapter": "L3.1",
    "title": "Đếm phân tích số nguyên - top-down",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      18
    ],
    "kind": "V",
    "statement": "Giải lại bài đếm phân tích số bằng đệ quy có nhớ; trạng thái chưa tính phải được phân biệt với kết quả bằng 0.",
    "source_data": "Tính Getf(n,n); f(0,0)=1, f(0,v>0)=0.",
    "notes": ""
  },
  {
    "id": "L3.1-03",
    "chapter": "L3.1",
    "title": "Fibonacci và lưu trữ nghiệm",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      6,
      20,
      21
    ],
    "kind": "V",
    "statement": "So sánh đệ quy lặp lại bài toán con với lưu bảng và tính luân phiên khi tính Fibonacci.",
    "source_data": "f(1)=f(2)=1. Ví dụ f(6); f(100)=354224848179261915075.",
    "notes": "f(100) vượt số nguyên 64-bit; không âm thầm dùng kiểu dữ liệu bị tràn."
  },
  {
    "id": "L3.1-04",
    "chapter": "L3.1",
    "title": "Dãy con tăng dài nhất - LIS",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      22,
      23,
      24,
      25,
      26,
      27,
      28
    ],
    "kind": "G",
    "statement": "Tìm dãy con tăng nghiêm ngặt dài nhất, lập bảng phương án và truy vết; cài đặt bằng C++ và test theo yêu cầu lập trình cặp đôi.",
    "source_data": "A=[1,3,6,2,7,8,5,4,9]; ví dụ đáp án [1,3,6,7,8,9].",
    "notes": "Dãy con không bắt buộc liên tiếp. Ký hiệu truy vết trong slide chưa thống nhất chiều; kiểm chứng thay vì sao chép máy móc."
  },
  {
    "id": "L3.1-05",
    "chapter": "L3.1",
    "title": "Ba lô 0/1",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      29,
      30,
      31,
      32,
      33,
      34,
      35
    ],
    "kind": "G",
    "statement": "Có n<=100 gói hàng, trọng lượng W[i], giá trị V[i], sức chứa M. Chọn các gói có tổng trọng lượng không vượt M và tổng giá trị lớn nhất; truy vết các gói đã lấy. Cài đặt C++ và test.",
    "source_data": "n=6, M=20; W=[10,5,8,4,12,8]; V=[12,14,10,12,6,15]. Ảnh nguồn cho giá trị 41, các gói 6,4,2.",
    "notes": "Mỗi gói được chọn tối đa một lần theo công thức truy hồi trong slide."
  },
  {
    "id": "L3.1-06",
    "chapter": "L3.1",
    "title": "Xâu con chung dài nhất - LCS",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      36,
      37,
      38,
      39
    ],
    "kind": "G",
    "statement": "Cho X=x1...xm và Y=y1...yn. Tìm dãy ký tự Z dài nhất là dãy con của cả X và Y.",
    "source_data": "X=AB1CD2EF3; Y=ABCDEF123; Z=ABCDEF3.",
    "notes": "Subsequence, không phải substring liên tiếp."
  },
  {
    "id": "L3.1-07",
    "chapter": "L3.1",
    "title": "RobotCam thu thập quà",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      41,
      42,
      48
    ],
    "kind": "G",
    "statement": "Cho n<=10^6 phần quà ở các điểm tọa độ nguyên. Tìm đường đi của robot thu nhiều phần quà nhất; bắt đầu/kết thúc ở điểm đã cho và không đi sang trái hoặc xuống dưới.",
    "source_data": "Gợi ý nguồn: sắp x tăng, cùng x thì y tăng; tìm dãy tung độ không giảm dài nhất.",
    "notes": "Nguồn có câu “thu nhặt tất cả” nhưng mục tiêu cuối là thu nhiều nhất; giữ mục tiêu cuối và ghi nhận mâu thuẫn. Chưa quy định các điểm trùng tọa độ."
  },
  {
    "id": "L3.1-08",
    "chapter": "L3.1",
    "title": "Nối các điểm cùng nhãn không giao nhau",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      43,
      44,
      48
    ],
    "kind": "G",
    "statement": "Trên mỗi đường thẳng song song a,b có n điểm, nhãn trái sang phải là hai hoán vị của 1..n, n<=10^6. Chọn tối đa đoạn nối hai điểm cùng nhãn trên hai đường sao cho các đoạn đôi một không có điểm chung.",
    "source_data": "Ví dụ: a=[2,3,1,5,6,4]; b=[3,2,5,6,1,4].",
    "notes": "Nguồn so sánh mô hình LCS O(n²) với quy về LIS O(n log n)."
  },
  {
    "id": "L3.1-09",
    "chapter": "L3.1",
    "title": "Vì sao không tìm LIS bằng sắp xếp rồi LCS?",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      44
    ],
    "kind": "G",
    "statement": "Xét cách sắp xếp A thành B rồi tìm LCS(A,B) để tìm LIS của A. Giải thích vì sao không làm như vậy.",
    "source_data": "",
    "notes": "Cần xét chi phí và phân biệt tăng nghiêm ngặt/không giảm khi có giá trị trùng."
  },
  {
    "id": "L3.1-10",
    "chapter": "L3.1",
    "title": "Số con chung lớn nhất",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      45,
      46,
      47,
      48
    ],
    "kind": "G",
    "statement": "Cho hai số nguyên dương x,y có tối đa 1000 chữ số, không chứa chữ số 0. Tìm số z lớn nhất thu được bằng cách xóa bớt chữ số của cả x và y, giữ thứ tự chữ số.",
    "source_data": "x=37149285; y=97142852; z=714285. Phản ví dụ LCS: x=1919,y=9191; 919 và 191 cùng độ dài nhưng giá trị khác nhau.",
    "notes": "Câu định nghĩa “a là con của b” trong trang 45 viết ngược chiều so với ví dụ; đây là phát biểu chuẩn hóa theo ví dụ, không phải sửa ngầm nguyên bản. Trường hợp không có chữ số chung chưa được quy định."
  },
  {
    "id": "L3.1-11",
    "chapter": "L3.1",
    "title": "Nhân ma trận - chỉ nêu tên",
    "source_file": "L3.1 - Quy hoach dong.pdf",
    "pdf_pages": [
      12
    ],
    "kind": "R",
    "statement": "Slide chỉ liệt kê “Bài toán nhân ma trận” trong danh sách ví dụ, không đưa đề hoặc dữ liệu riêng.",
    "source_data": "",
    "notes": "Không tự thêm bài tối ưu chuỗi nhân ma trận rồi nhận là đề gốc."
  },
  {
    "id": "L3.2-01",
    "chapter": "L3.2",
    "title": "Tối đa cuộc họp trong một phòng",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      5,
      6,
      7,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41
    ],
    "kind": "G",
    "statement": "Cho N cuộc họp với thời điểm bắt đầu/kết thúc, chọn tối đa cuộc họp không chồng chéo trong một phòng. Đề xuất thuật toán và cài đặt hàm chọn hoạt động.",
    "source_data": "start=[1,3,2,0,5,8,5]; finish=[2,4,5,6,6,9,9]. Nguồn trả các ID [0,1,4,5], tổng 4.",
    "notes": "Bảng trang 6/29 ghi start[3]=1, nhưng code trang 7/41 ghi start[3]=0; giữ hai phiên bản và đánh dấu mâu thuẫn, không sửa ngầm. Dữ liệu gốc đã theo thời điểm kết thúc tăng; nếu nhận dữ liệu chưa sắp phải giữ ID. Cho phép finish trước bằng start sau."
  },
  {
    "id": "L3.2-02",
    "chapter": "L3.2",
    "title": "Đổi 870 won bằng tham lam",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27
    ],
    "kind": "G",
    "statement": "Với số lượng không giới hạn các xu 500,100,50,10 won, đổi số tiền cho trước bằng ít xu nhất; cài đặt coin_change và minh họa các lựa chọn.",
    "source_data": "amount=870; kết quả nguồn [500,100,100,100,50,10,10], 7 xu.",
    "notes": ""
  },
  {
    "id": "L3.2-03",
    "chapter": "L3.2",
    "title": "Đổi tiền - số lượng từng mệnh giá",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      28
    ],
    "kind": "G",
    "statement": "Viết coin_change(coins,amount), đầu vào là danh sách mệnh giá và số tiền, đầu ra là số lượng mỗi loại tiền.",
    "source_data": "coins=[500,200,100,50,20,10,5,2,1]; amount=10352. Thời gian 15 phút.",
    "notes": "Số 10352 đã đọc lại từ ảnh; OCR tự động có thể nhận nhầm 10552."
  },
  {
    "id": "L3.2-04",
    "chapter": "L3.2",
    "title": "Cài đặt chọn hoạt động - bộ 10 hoạt động",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      42,
      43
    ],
    "kind": "G",
    "statement": "Viết activity_selection(start,finish), trả danh sách hoạt động được lựa chọn. Nộp chương trình lên Padlet theo yêu cầu nguồn.",
    "source_data": "ID=0..9; start=[1,5,2,1,2,4,6,2,4,7]; finish=[4,8,5,6,6,7,9,7,6,11]. Thời gian 15 phút.",
    "notes": ""
  },
  {
    "id": "L3.2-05",
    "chapter": "L3.2",
    "title": "Bài toán ba lô trong chương tham lam",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      44
    ],
    "kind": "G",
    "statement": "Cho ba lô sức chứa M và n đồ vật với cân nặng w[i], giá trị v[i]. Tìm cách lấy đồ vật sao cho tổng trọng lượng không vượt M, tổng giá trị lớn nhất.",
    "source_data": "M=36; w=[10,5,2,16,2,9,5,8,15,6]; v=[12,6,7,4,6,12,9,6,8,11].",
    "notes": "Slide không nói được chia nhỏ đồ vật hay không. Không tự kết luận đây là fractional knapsack hoặc greedy luôn tối ưu cho ba lô 0/1."
  },
  {
    "id": "L3.2-06",
    "chapter": "L3.2",
    "title": "Kiểm tra tham lam với xu 400",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      46
    ],
    "kind": "G",
    "statement": "Cho coins=[500,400,100,50,10]. Hãy đưa ra kết quả coin_change với amount=800.",
    "source_data": "Slide yêu cầu đầu ra thuật toán, không đưa đáp án.",
    "notes": "Nếu so sánh với nghiệm tối ưu thì ghi đó là phân tích bổ sung, không phải đáp án có sẵn trong PDF."
  },
  {
    "id": "L3.2-07",
    "chapter": "L3.2",
    "title": "Đổi tiền hữu hạn - ví dụ ví tiền",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      48
    ],
    "kind": "G",
    "statement": "Khi số xu không vô hạn, chọn những xu trong ví để trả 710 won.",
    "source_data": "Ví có [500,100,50,50,50,10,10]; hình chọn [500,100,50,50,10].",
    "notes": ""
  },
  {
    "id": "L3.2-08",
    "chapter": "L3.2",
    "title": "Đổi tiền hữu hạn - viết hàm tối thiểu",
    "source_file": "L3.2 - Tham lam.pdf",
    "pdf_pages": [
      49
    ],
    "kind": "G",
    "statement": "Viết hàm coin_change2 trả số lượng xu tối thiểu khi biết tiền cần đổi và các đồng xu hiện có của mỗi mệnh giá.",
    "source_data": "Dòng nhập: 500 50 50 100 50 10 10; amount=710; nguồn in [500,100,50,50,10] và 5.",
    "notes": "Hàm mẫu được gọi để trả danh sách rồi lấy len; ghi rõ hợp đồng trả về khi triển khai. Không dùng greedy như bảo đảm tối ưu cho mọi bộ xu hữu hạn."
  },
  {
    "id": "L4-01",
    "chapter": "L4",
    "title": "Chương trình menu danh sách liên kết đơn",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      67
    ],
    "kind": "G",
    "statement": "Viết chương trình xây dựng danh sách liên kết đơn có menu với đủ 13 chức năng dưới đây.",
    "source_data": "1. Thêm một nút đầu.\n2. Thêm một nút cuối.\n3. Thêm nhiều nút đầu.\n4. Thêm nhiều nút cuối.\n5. Thêm một nút sau nút được chọn.\n6. Hiển thị danh sách.\n7. Tìm một nút.\n8. Chọn và hiển thị nút thứ n.\n9. Hiển thị số nút.\n10. Xóa một nút.\n11. Xóa toàn bộ danh sách.\n12. Tính tổng giá trị tất cả nút.\n13. Chèn nút mới vào danh sách đã sắp xếp.",
    "notes": "Một đề tổng hợp gồm 13 yêu cầu, không đếm thành 13 đề độc lập. Trang PDF 67 có số slide in 78."
  },
  {
    "id": "L4-02",
    "chapter": "L4",
    "title": "DSLK đơn - khai báo, cấp phát và khởi tạo",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22
    ],
    "kind": "V",
    "statement": "Khai báo Node và List với pHead,pTail; tạo nút mới và danh sách rỗng.",
    "source_data": "Ví dụ nút số nguyên và nút sinh viên tại trang 16.",
    "notes": ""
  },
  {
    "id": "L4-03",
    "chapter": "L4",
    "title": "DSLK đơn - chèn đầu/cuối/sau q",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "kind": "V",
    "statement": "Minh họa và cài đặt thêm nút vào đầu, cuối, sau q; xử lý danh sách rỗng và cập nhật pHead,pTail.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L4-04",
    "chapter": "L4",
    "title": "DSLK đơn - duyệt và tìm kiếm",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      45,
      46,
      47,
      48,
      49
    ],
    "kind": "V",
    "statement": "Duyệt để in các phần tử, tìm nút có khóa x.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L4-05",
    "chapter": "L4",
    "title": "DSLK đơn - xóa, đếm và trích nút",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66
    ],
    "kind": "V",
    "statement": "Xóa nút đầu, nút sau q, nút có khóa k, hủy cả danh sách; đếm nút; trích nút đầu bằng PickHead.",
    "source_data": "",
    "notes": "Phân biệt lấy nút ra khỏi danh sách và giải phóng nút."
  },
  {
    "id": "L4-06",
    "chapter": "L4",
    "title": "DSLK đôi - tạo và bốn kiểu chèn",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      69,
      70,
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78,
      79,
      80
    ],
    "kind": "V",
    "statement": "Khai báo node có pPrev,pNext, tạo nút; chèn đầu, cuối, trước q và sau q.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L4-07",
    "chapter": "L4",
    "title": "DSLK đôi - năm kiểu xóa",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      81,
      82,
      83,
      84,
      85,
      86,
      87
    ],
    "kind": "V",
    "statement": "Xóa đầu, cuối, trước q, sau q và nút có khóa k.",
    "source_data": "",
    "notes": "Code slide có chỗ truy cập con trỏ sau khi có thể trở thành NULL; dùng làm tài liệu tham khảo, không sao chép lỗi."
  },
  {
    "id": "L4-08",
    "chapter": "L4",
    "title": "DSLK vòng - tìm, chèn và xóa",
    "source_file": "L4 - Danh sach tuyen tinh.pdf",
    "pdf_pages": [
      91,
      92,
      93,
      94,
      95,
      96,
      97,
      98,
      99
    ],
    "kind": "V",
    "statement": "Biểu diễn danh sách vòng; tìm kiếm; chèn đầu, cuối, sau q; xóa đầu, xóa sau q; duy trì liên kết vòng.",
    "source_data": "",
    "notes": "Slide 94 và các thao tác xóa cần kiểm tra danh sách rỗng, không tìm thấy và danh sách một nút khi triển khai."
  },
  {
    "id": "L5-01",
    "chapter": "L5",
    "title": "Mô phỏng thao tác Stack",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      4,
      5
    ],
    "kind": "V",
    "statement": "Theo dõi push/pop, đỉnh và trạng thái rỗng.",
    "source_data": "Chuỗi thao tác 5 3 2 - - 4; dấu - biểu diễn lấy phần tử.",
    "notes": ""
  },
  {
    "id": "L5-02",
    "chapter": "L5",
    "title": "Stack bằng mảng",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ],
    "kind": "V",
    "statement": "Khai báo mảng và top; khởi tạo, isEmpty, isFull, push, pop; xét tràn/rỗng.",
    "source_data": "",
    "notes": "Slide có quy ước top không thống nhất: code khởi tạo -1; phải kiểm tra biên N-1 khi cài đặt."
  },
  {
    "id": "L5-03",
    "chapter": "L5",
    "title": "Stack bằng DSLK",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      15,
      16,
      17,
      18,
      19
    ],
    "kind": "V",
    "statement": "Khai báo, khởi tạo, kiểm tra rỗng, push và pop bằng danh sách liên kết đơn.",
    "source_data": "",
    "notes": "Pop trong slide có lệnh ngắt liên kết trước khi cập nhật top; không sao chép nguyên lỗi mất danh sách."
  },
  {
    "id": "L5-04",
    "chapter": "L5",
    "title": "Khử đệ quy Quick Sort bằng Stack",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      21
    ],
    "kind": "V",
    "statement": "Dùng stack lưu các đoạn (l,r), phân hoạch và xử lý dần để thay lời gọi đệ quy Quick Sort.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L5-05",
    "chapter": "L5",
    "title": "Đổi cơ số bằng Stack",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      22,
      23
    ],
    "kind": "G",
    "statement": "Đổi một số từ hệ cơ số 10 sang hệ cơ số x bằng stack lưu các số dư.",
    "source_data": "Ví dụ 55 ở cơ số 10 thành 110111 ở cơ số 2.",
    "notes": "Giới hạn cơ số và ký hiệu cho chữ số >=10 chưa được nguồn quy định."
  },
  {
    "id": "L5-06",
    "chapter": "L5",
    "title": "Đối chiếu infix, postfix, prefix",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      25
    ],
    "kind": "V",
    "statement": "Chuyển/đối chiếu các dạng biểu diễn của năm biểu thức minh họa.",
    "source_data": "A+B; A*B+C; A*(B+C); A-(B-(C-D)); A-B-C-D.",
    "notes": ""
  },
  {
    "id": "L5-07",
    "chapter": "L5",
    "title": "Lượng giá biểu thức hậu tố",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      26,
      27,
      28
    ],
    "kind": "V",
    "statement": "Tính giá trị biểu thức RPN bằng stack; mỗi toán tử lấy hai toán hạng đúng thứ tự.",
    "source_data": "2*((3+4)-(5-6)) -> 2 3 4 + 5 6 - - *; kết quả nguồn 16.",
    "notes": ""
  },
  {
    "id": "L5-08",
    "chapter": "L5",
    "title": "Chuyển infix sang postfix - biểu thức 1",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      29,
      30,
      31,
      32,
      33
    ],
    "kind": "V",
    "statement": "Dùng stack toán tử để chuyển infix sang postfix, xét ngoặc và ưu tiên phép toán.",
    "source_data": "(A+B*C)/(D-(E-F)); kết quả nguồn ABC*+DEF--/.",
    "notes": ""
  },
  {
    "id": "L5-09",
    "chapter": "L5",
    "title": "Chuyển infix sang postfix - biểu thức 2",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50
    ],
    "kind": "V",
    "statement": "Theo dõi stack S và chuỗi kết quả KQ qua từng bước chuyển biểu thức.",
    "source_data": "A+(B*C-(D/E^F)*G)*H; kết quả nguồn ABC*DEF^/G*-H*+.",
    "notes": "Dấu ^ trong biểu thức là lũy thừa theo tài liệu, không phải toán tử XOR khi chuyển sang code C++."
  },
  {
    "id": "L5-10",
    "chapter": "L5",
    "title": "Mô phỏng Queue",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      54,
      55
    ],
    "kind": "V",
    "statement": "Theo dõi enqueue/dequeue, front và rear.",
    "source_data": "Chuỗi thao tác 5 3 2 - - 4; so sánh thứ tự lấy ra với Stack.",
    "notes": ""
  },
  {
    "id": "L5-11",
    "chapter": "L5",
    "title": "Queue mảng vòng",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78,
      79
    ],
    "kind": "V",
    "statement": "Biểu diễn hàng đợi bằng mảng vòng; khởi tạo, kiểm tra rỗng/đầy, enqueue, dequeue và front.",
    "source_data": "",
    "notes": "Các trang 60-72 minh họa front/rear; giữ đúng trạng thái trong ảnh nguồn."
  },
  {
    "id": "L5-12",
    "chapter": "L5",
    "title": "Queue bằng DSLK",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      80,
      81,
      82,
      83,
      84,
      85,
      86
    ],
    "kind": "V",
    "statement": "Cài đặt hàng đợi bằng danh sách liên kết đơn có đầu/cuối; khởi tạo, isEmpty, enqueue, dequeue, front.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L5-13",
    "chapter": "L5",
    "title": "Ứng dụng Queue - chỉ nêu hướng",
    "source_file": "L5 - stack and queue.pdf",
    "pdf_pages": [
      87
    ],
    "kind": "R",
    "statement": "Nguồn liệt kê ứng dụng, bao gồm bài toán sản xuất-tiêu thụ và điều phối; không có đề lập trình kèm dữ liệu riêng.",
    "source_data": "",
    "notes": "Không tự tạo bài quản lý hàng đợi ngoài nội dung slide."
  },
  {
    "id": "L6-01",
    "chapter": "L6",
    "title": "Nhận dạng cây và các khái niệm",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "kind": "V",
    "statement": "Quan sát các cây minh họa: quan hệ cha/con, gốc, lá, nút nhánh, bậc, mức, chiều cao và độ dài đường đi.",
    "source_data": "Có ví dụ không phải cây tại trang 8; các hình giữ trong thư mục ảnh.",
    "notes": "Đây là ví dụ lý thuyết, không phải đề bài được giao riêng."
  },
  {
    "id": "L6-02",
    "chapter": "L6",
    "title": "Biểu diễn cây nhị phân",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22
    ],
    "kind": "V",
    "statement": "Biểu diễn cây nhị phân bằng mảng và bằng nút liên kết trái/phải; nhận biết cây lệch và cây biểu thức.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L6-03",
    "chapter": "L6",
    "title": "Duyệt cây NLR, LNR, LRN",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      23,
      24,
      25,
      26,
      27,
      28,
      29
    ],
    "kind": "V",
    "statement": "Minh họa ba cách duyệt trên cùng cây trong hình trang 25/27/29.",
    "source_data": "NLR: A B D H I N E J O K C F L P G M.\nLNR: H D N I B J O E K A F P L C M G.\nLRN: H N I D O J K E B P L F M G C A.",
    "notes": "Các chuỗi là kết quả in trong nguồn. Quan hệ cạnh cần xem ảnh, không suy ra từ thứ tự chữ trích xuất PDF."
  },
  {
    "id": "L6-04",
    "chapter": "L6",
    "title": "Tính giá trị cây biểu thức",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      30,
      31
    ],
    "kind": "V",
    "statement": "Biểu diễn biểu thức bằng cây và tính giá trị qua duyệt sau.",
    "source_data": "(3+1)*3/(9-5+2) - (3*(7-4)+6); kết quả nguồn -13.",
    "notes": ""
  },
  {
    "id": "L6-05",
    "chapter": "L6",
    "title": "Đếm nút, đếm lá, chiều cao",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      32,
      33,
      34,
      35,
      36,
      37,
      38
    ],
    "kind": "V",
    "statement": "Cài đặt đệ quy đếm số nút, đếm nút lá và tính chiều cao cây.",
    "source_data": "Nguồn dùng chiều cao cây rỗng -1, nút đơn cao 0 ở phần công thức trang 38.",
    "notes": "Phải nêu quy ước chiều cao; các phần lý thuyết có thể dùng cách đếm mức khác."
  },
  {
    "id": "L6-06",
    "chapter": "L6",
    "title": "Duyệt và tìm trên BST",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53
    ],
    "kind": "V",
    "statement": "Minh họa tính chất BST, duyệt cây và tìm khóa bằng đệ quy/vòng lặp.",
    "source_data": "Cây số trong hình trang 42,46-50.",
    "notes": "Không tự thêm quy tắc cho khóa trùng; nguồn định nghĩa khóa trái nhỏ hơn, phải lớn hơn."
  },
  {
    "id": "L6-07",
    "chapter": "L6",
    "title": "Tạo BST - dãy 7 khóa",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      54,
      55,
      56
    ],
    "kind": "V",
    "statement": "Lần lượt chèn các khóa vào BST ban đầu rỗng và vẽ cây sau mỗi lần chèn.",
    "source_data": "4,6,1,2,5,7,3.",
    "notes": ""
  },
  {
    "id": "L6-08",
    "chapter": "L6",
    "title": "Tạo BST - dãy 10 khóa",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      57
    ],
    "kind": "V",
    "statement": "Lần lượt chèn các khóa vào BST và minh họa quá trình.",
    "source_data": "30,12,17,49,22,65,51,56,70,68.",
    "notes": ""
  },
  {
    "id": "L6-09",
    "chapter": "L6",
    "title": "Xóa BST - ba trường hợp",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66
    ],
    "kind": "V",
    "statement": "Xóa khóa X khi nút là lá, có một con hoặc có hai con; chọn nút thế mạng và cập nhật liên kết.",
    "source_data": "Ví dụ xóa 18, thay bằng 23 tại trang 63.",
    "notes": ""
  },
  {
    "id": "L6-10",
    "chapter": "L6",
    "title": "Minh họa xóa 51,83,36 và gốc",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      67,
      68,
      69,
      70
    ],
    "kind": "V",
    "statement": "Thực hiện các ví dụ xóa 51, xóa 83, xóa 36 và xóa gốc hai lần trên các cây được vẽ ở từng trang.",
    "source_data": "",
    "notes": "Dùng đúng hình cây ban đầu của từng ví dụ; không giả định là một chuỗi thao tác trên cây vừa tạo ở mục khác."
  },
  {
    "id": "L6-11",
    "chapter": "L6",
    "title": "Minh họa xóa 15 và 42",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78
    ],
    "kind": "V",
    "statement": "Theo dõi ví dụ xóa 15, xóa 42 và xóa 15 rồi 42; quan sát nút thế mạng và cây sau khi xóa.",
    "source_data": "",
    "notes": "Hình nguồn trang 71-78 được giữ để tránh mất cấu trúc cây."
  },
  {
    "id": "L6-12",
    "chapter": "L6",
    "title": "Hủy toàn bộ BST",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      79
    ],
    "kind": "V",
    "statement": "Duyệt sau để giải phóng cây con trái, cây con phải rồi nút hiện tại.",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L6-13",
    "chapter": "L6",
    "title": "BST lệch theo thứ tự chèn",
    "source_file": "L6 - Cay (tree).pdf",
    "pdf_pages": [
      80,
      81
    ],
    "kind": "V",
    "statement": "Quan sát cây lệch khi chèn theo thứ tự tăng và thảo luận chi phí thao tác theo chiều cao cây.",
    "source_data": "Nguồn minh họa dãy 1,2,3,4,5 và hình cây tương ứng ở trang 81.",
    "notes": "Phần này là nhận xét/ví dụ, không phải bài tập riêng."
  },
  {
    "id": "L7-01",
    "chapter": "L7",
    "title": "Interchange Sort - ví dụ và cài đặt",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20
    ],
    "kind": "V",
    "statement": "Minh họa đổi chỗ trực tiếp, theo dõi i,j và cài đặt thuật toán tăng dần.",
    "source_data": "A=[12,2,8,5,1,6,4,15].",
    "notes": ""
  },
  {
    "id": "L7-02",
    "chapter": "L7",
    "title": "Interchange Sort - bài tập áp dụng",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      21,
      22
    ],
    "kind": "G",
    "statement": "Minh họa các bước đổi chỗ trực tiếp trên dãy cho trong slide.",
    "source_data": "A=[9,7,4,5,8].",
    "notes": "Nguồn có các trạng thái trung gian; giữ hình để đối chiếu."
  },
  {
    "id": "L7-03",
    "chapter": "L7",
    "title": "Selection Sort - ví dụ và cài đặt",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36
    ],
    "kind": "V",
    "statement": "Chọn phần tử nhỏ nhất của đoạn chưa sắp, đổi vào đầu đoạn và ghi các bước.",
    "source_data": "A=[12,2,8,5,1,6,4,15].",
    "notes": ""
  },
  {
    "id": "L7-04",
    "chapter": "L7",
    "title": "Selection Sort - chạy từng bước",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      37
    ],
    "kind": "G",
    "statement": "Cho biết kết quả chạy từng bước của chọn trực tiếp.",
    "source_data": "A=[9,7,4,4,8].",
    "notes": ""
  },
  {
    "id": "L7-05",
    "chapter": "L7",
    "title": "Bubble Sort - ví dụ và cài đặt",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52
    ],
    "kind": "V",
    "statement": "Minh họa nổi bọt theo chiều j từ cuối về đầu, đưa phần tử nhỏ về đầu đoạn chưa sắp.",
    "source_data": "Trang 40 cho dãy [2,12,8,5,1,6,4,15]; xem các ảnh trong chuỗi minh họa.",
    "notes": "Không dùng chiều duyệt khác rồi nhận các bước trung gian là giống nguồn."
  },
  {
    "id": "L7-06",
    "chapter": "L7",
    "title": "Bubble Sort - điền các ô còn thiếu",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      53
    ],
    "kind": "G",
    "statement": "Điền trạng thái dãy ở hàng có dấu hỏi trong ví dụ nổi bọt.",
    "source_data": "Ban đầu [9,8,2,7,4,5,2]; hàng cần điền [2,2,?,?,?,?,?]; hàng đáp án nguồn [2,2,9,8,4,7,5].",
    "notes": ""
  },
  {
    "id": "L7-07",
    "chapter": "L7",
    "title": "Bubble Sort - ghi các bước",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      54,
      55
    ],
    "kind": "G",
    "statement": "Ghi kết quả chạy từng bước của nổi bọt.",
    "source_data": "A=[9,7,4,3,5].",
    "notes": ""
  },
  {
    "id": "L7-08",
    "chapter": "L7",
    "title": "Insertion Sort - ví dụ và cài đặt",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68,
      69,
      70
    ],
    "kind": "V",
    "statement": "Minh họa lưu phần tử x, dịch các phần tử lớn hơn và chèn vào đoạn đã có thứ tự.",
    "source_data": "A=[12,2,8,5,1,6,4,15] trong chuỗi minh họa.",
    "notes": ""
  },
  {
    "id": "L7-09",
    "chapter": "L7",
    "title": "Insertion Sort - chạy từng bước",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      71
    ],
    "kind": "G",
    "statement": "Ghi kết quả chạy từng bước của chèn trực tiếp.",
    "source_data": "A=[9,7,4,3,5].",
    "notes": ""
  },
  {
    "id": "L7-10",
    "chapter": "L7",
    "title": "Quick Sort - pivot ở giữa",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      73,
      74,
      75,
      76,
      77,
      78,
      79,
      80,
      81,
      82,
      83,
      84,
      85,
      86,
      87,
      88,
      89
    ],
    "kind": "V",
    "statement": "Minh họa phân hoạch, các chỉ số i,j và hai lời gọi đệ quy; cài đặt theo biến thể pivot giữa.",
    "source_data": "A=[12,2,8,5,1,6,4,15]; lần đầu l=0,r=7,pivot=a[3]=5.",
    "notes": ""
  },
  {
    "id": "L7-11",
    "chapter": "L7",
    "title": "Quick Sort - bài tập áp dụng",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      90
    ],
    "kind": "G",
    "statement": "Minh họa Quick Sort trên dãy cho trong trang bài tập.",
    "source_data": "Hàng đầu [8,1,4,12,2,5,6,15].",
    "notes": "Trang có các hàng trung gian; không dùng chúng làm các đầu vào độc lập."
  },
  {
    "id": "L7-12",
    "chapter": "L7",
    "title": "Heap Sort - yêu cầu đọc tài liệu",
    "source_file": "L7 - Sap xep.pdf",
    "pdf_pages": [
      72,
      91
    ],
    "kind": "R",
    "statement": "Xem trước Heap Sort; trang 91 yêu cầu xem tài liệu thầy Lê Minh Hoàng.",
    "source_data": "",
    "notes": "Không có đề, mã hoặc bộ số Heap Sort cụ thể trong file này; không bịa bài tập."
  },
  {
    "id": "L8-01",
    "chapter": "L8",
    "title": "Trộn hai dãy bi đã sắp",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      6,
      7
    ],
    "kind": "G",
    "statement": "Có hai nhóm, mỗi nhóm bốn viên bi, đã xếp tăng theo trọng lượng. Dùng cân so sánh hai viên nhẹ nhất còn lại để trộn thành một dãy tăng. Hỏi cần bao nhiêu phép so sánh.",
    "source_data": "",
    "notes": "Không có trọng lượng số cụ thể; phân biệt số so sánh trong trường hợp cụ thể và giới hạn tổng quát."
  },
  {
    "id": "L8-02",
    "chapter": "L8",
    "title": "Merge Sort - ví dụ 8 phần tử",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24
    ],
    "kind": "V",
    "statement": "Theo dõi chia đôi và trộn các dãy đã có thứ tự.",
    "source_data": "S=[27,10,12,20,25,13,15,22].",
    "notes": ""
  },
  {
    "id": "L8-03",
    "chapter": "L8",
    "title": "Merge Sort - bài paper coding",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      26
    ],
    "kind": "G",
    "statement": "Minh họa thuật toán sắp xếp trộn với dãy 10 số.",
    "source_data": "[21,15,3,9,21,6,27,4,10,16].",
    "notes": "Phần tử thứ ba là 3, đã đối chiếu ảnh; OCR có thể nhầm thành 5."
  },
  {
    "id": "L8-04",
    "chapter": "L8",
    "title": "Merge Sort dùng hai danh sách con",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      28,
      29,
      30,
      31,
      32,
      33,
      34
    ],
    "kind": "V",
    "statement": "Cài đặt mergesort1(S) và merge1(S,L,R), chia bằng hai danh sách con, trộn lại S; in trạng thái theo minh họa.",
    "source_data": "",
    "notes": "Bản Python dùng pop(0); khi phân tích chi phí phải tính chi phí dịch phần tử, không mặc định thao tác này O(1)."
  },
  {
    "id": "L8-05",
    "chapter": "L8",
    "title": "Merge Sort dùng chỉ số",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      35,
      36,
      37,
      38,
      39,
      40,
      41
    ],
    "kind": "V",
    "statement": "Cài đặt mergesort2(S,low,high) và merge2(S,low,mid,high), dùng chỉ số và một danh sách tạm rồi chép kết quả vào đoạn tương ứng.",
    "source_data": "",
    "notes": "Mã trong slide có chỗ biến vòng lặp và chỉ số append cần kiểm tra; không sao chép lỗi OCR hoặc lỗi slide."
  },
  {
    "id": "L8-06",
    "chapter": "L8",
    "title": "Phân hoạch bảy viên bi theo pivot",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      46,
      47,
      48
    ],
    "kind": "G",
    "statement": "Có bảy viên bi trọng lượng khác nhau, một viên đỏ làm pivot. Chỉ so sánh và đổi chỗ để đưa viên nhẹ hơn sang trái, nặng hơn sang phải; thảo luận số so sánh.",
    "source_data": "",
    "notes": "Không có dữ liệu trọng lượng số. Phân hoạch một lần không đồng nghĩa toàn bộ dãy đã được sắp xếp."
  },
  {
    "id": "L8-07",
    "chapter": "L8",
    "title": "Quick Sort - ví dụ 7 phần tử",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65
    ],
    "kind": "V",
    "statement": "Minh họa phân hoạch và đệ quy Quick Sort.",
    "source_data": "S=[15,10,12,20,25,13,22].",
    "notes": ""
  },
  {
    "id": "L8-08",
    "chapter": "L8",
    "title": "Quick Sort - bài paper coding",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      68
    ],
    "kind": "G",
    "statement": "Minh họa thuật toán sắp xếp nhanh với dãy 10 số.",
    "source_data": "[21,15,3,9,21,6,27,4,10,16].",
    "notes": "Nêu rõ biến thể pivot khi lập bảng bước; file sau đó cài pivot đầu tiên."
  },
  {
    "id": "L8-09",
    "chapter": "L8",
    "title": "Quick Sort pivot đầu và trường hợp xấu",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      70,
      71,
      72,
      73,
      74,
      75,
      76
    ],
    "kind": "V",
    "statement": "Cài quicksort1/partition1 với pivot đầu; theo dõi ví dụ và dữ liệu giảm dần.",
    "source_data": "Ví dụ [15,10,12,20,25,13,22]; giảm dần [25,22,20,15,13,12,10].",
    "notes": ""
  },
  {
    "id": "L8-10",
    "chapter": "L8",
    "title": "Quick Sort pivot ngẫu nhiên",
    "source_file": "L8 - Merge sort and QuickSort.pdf",
    "pdf_pages": [
      66,
      77,
      78,
      79
    ],
    "kind": "V",
    "statement": "Cài quicksort2/partition2 bằng cách chọn chỉ số ngẫu nhiên trong [low,high], đổi với đầu đoạn rồi phân hoạch. So sánh với pivot đầu.",
    "source_data": "Dữ liệu minh họa giảm dần [25,22,20,15,13,12,10].",
    "notes": "Không bảo đảm hết trường hợp xấu với mọi lựa chọn ngẫu nhiên; nếu tái lập trace cần ghi seed."
  },
  {
    "id": "L9-01",
    "chapter": "L9",
    "title": "Thả trứng với một quả",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "kind": "G",
    "statement": "Cho chiều cao tòa nhà. Tìm tầng cao nhất có thể thả trứng không vỡ, chỉ có một quả nên phải dừng thử khi trứng vỡ. Dùng hàm do_experiment(floor).",
    "source_data": "breaking là tầng đầu tiên gây vỡ, sinh ngẫu nhiên từ 1..height; thử tuần tự. Nếu vỡ ở tầng 1 trả 0; nếu không vỡ đến đỉnh trả height.",
    "notes": "breaking là dữ liệu mô phỏng phép thử, không dùng trực tiếp breaking-1 để bỏ qua bài học tìm kiếm. Một số câu dịch lẫn “tầng an toàn” và “tầng vỡ”; xem code nguồn."
  },
  {
    "id": "L9-02",
    "chapter": "L9",
    "title": "Tìm kiếm tuần tự",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23
    ],
    "kind": "G",
    "statement": "Cho danh sách số nguyên S và x, trả chỉ số nếu tìm thấy x, ngược lại -1. Cài seq_search.",
    "source_data": "S=[11,37,45,26,59,28,17,53]; x=53 -> 7 (chỉ số từ 0).",
    "notes": ""
  },
  {
    "id": "L9-03",
    "chapter": "L9",
    "title": "Phân tích tìm kiếm tuần tự",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      24
    ],
    "kind": "G",
    "statement": "Phân tích Big-O tốt nhất, xấu nhất và trung bình. Với N phần tử, tính tổng số phép so sánh khi tìm mỗi phần tử một lần.",
    "source_data": "Nguồn xét 1+2+...+N và trung bình (N+1)/2.",
    "notes": "Trường hợp trung bình này giả định tìm thành công các vị trí với tần suất bằng nhau."
  },
  {
    "id": "L9-04",
    "chapter": "L9",
    "title": "Tìm chỉ số phần tử lớn nhất",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36
    ],
    "kind": "G",
    "statement": "Cho danh sách số nguyên, cài find_largest trả chỉ số phần tử có giá trị lớn nhất.",
    "source_data": "[11,37,45,26,59,28,17,53] -> chỉ số 4, giá trị 59.",
    "notes": "Dòng dịch “chỉ số lớn nhất” cần hiểu theo code/ví dụ là chỉ số của phần tử lớn nhất, không phải n-1."
  },
  {
    "id": "L9-05",
    "chapter": "L9",
    "title": "Thả trứng - phân tích và hai quả trứng",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      44
    ],
    "kind": "G",
    "statement": "Nêu độ phức tạp khi có một quả; thảo luận khi có vô số quả. Với hai quả và tòa nhà 100 tầng, cần ít nhất bao nhiêu phép thử trong trường hợp xấu nhất?",
    "source_data": "Nguồn nêu 14 phép thử cho hai quả và 100 tầng.",
    "notes": "Giữ riêng câu hỏi hai quả; không gộp thành bài nhị phân có vô hạn quả."
  },
  {
    "id": "L9-06",
    "chapter": "L9",
    "title": "Thả trứng với vô hạn quả",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      77,
      78,
      79,
      80,
      81,
      82,
      83
    ],
    "kind": "G",
    "statement": "Cho chiều cao tòa nhà và hàm thử trứng. Có đủ trứng để tiếp tục sau khi vỡ. Dùng tìm kiếm nhị phân xác định tầng an toàn cao nhất.",
    "source_data": "height=10, breaking=7 -> tầng an toàn 6.",
    "notes": "Code minh họa giả định breaking nằm trong 1..height; các trường hợp ngoài miền này phải ghi là mở rộng nếu thêm."
  },
  {
    "id": "L9-07",
    "chapter": "L9",
    "title": "Tìm kiếm nhị phân",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68,
      69,
      70,
      71,
      72
    ],
    "kind": "G",
    "statement": "Cho S đã sắp tăng và x; cài bin_search trả chỉ số tìm thấy hoặc -1.",
    "source_data": "S=[11,17,26,28,37,45,53,59]; x=53 -> 6. Chuỗi hình minh họa còn tìm 37 và trường hợp không có 31.",
    "notes": "Kiểm tra ảnh trang 61-69 khi cần đúng x của từng hình, tránh nhầm OCR."
  },
  {
    "id": "L9-08",
    "chapter": "L9",
    "title": "Độ phức tạp tìm kiếm nhị phân",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      68,
      69,
      73
    ],
    "kind": "G",
    "statement": "Phân tích trường hợp tốt nhất và xấu nhất theo số lần thu hẹp không gian tìm kiếm.",
    "source_data": "Nguồn dùng chuỗi N, N/2, N/4,...; kết luận tăng theo log N.",
    "notes": ""
  },
  {
    "id": "L9-09",
    "chapter": "L9",
    "title": "Đo số bước tìm kiếm nhị phân",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      74,
      75
    ],
    "kind": "G",
    "statement": "Thêm lệnh in low,high,mid vào bin_search để đếm số vòng lặp.",
    "source_data": "S=[11,17,26,28,37,45,53,59]; x=28 tìm thấy chỉ số 3 sau 1 vòng; x=77 không thấy sau 4 vòng theo nguồn.",
    "notes": ""
  },
  {
    "id": "L9-10",
    "chapter": "L9",
    "title": "Đo số bước thả trứng nhị phân",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      84,
      85,
      86
    ],
    "kind": "G",
    "statement": "In low,high,mid để kiểm tra số thao tác trong thuật toán thả trứng nhị phân.",
    "source_data": "height=100; breaking=50 -> tầng an toàn 49, 6 vòng. breaking=51 -> tầng an toàn 50, 7 vòng theo nguồn.",
    "notes": ""
  },
  {
    "id": "L9-11",
    "chapter": "L9",
    "title": "Chuyển số La Mã sang số nguyên",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      91,
      92,
      93,
      94,
      95,
      96,
      97,
      115,
      116,
      117,
      118
    ],
    "kind": "G",
    "statement": "Xây dựng công cụ roman_to_int chuyển chuỗi số La Mã thành số nguyên, dùng bảng giá trị ký hiệu và quy tắc trừ khi ký hiệu nhỏ đứng trước ký hiệu lớn.",
    "source_data": "I=1,V=5,X=10,L=50,C=100,D=500,M=1000. Ví dụ MDCLXVI=1666; MCDXLIV=1444; MCMXCIX=1999.",
    "notes": "Nguồn chưa yêu cầu kiểm tra mọi chuỗi La Mã sai; nếu thêm bộ kiểm tra cú pháp phải ghi là bổ sung."
  },
  {
    "id": "L9-12",
    "chapter": "L9",
    "title": "Băm tên sách vào tám ngăn",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      101,
      102,
      103,
      104
    ],
    "kind": "V",
    "statement": "Tính khóa bằng tổng mã ký tự của tên sách; băm theo key%8 để xếp vào giá tám ngăn.",
    "source_data": "The Little Prince; The Old Man and the Sea; The Little Mermaid; Beauty and the Beast; The Last Leaf. Khóa nguồn: 1584,1929,1678,1837,1133.",
    "notes": "Beauty and the Beast và The Last Leaf cùng bucket 5; cần bảo toàn va chạm."
  },
  {
    "id": "L9-13",
    "chapter": "L9",
    "title": "Cài lớp HashTable và tra cứu sách",
    "source_file": "L9 - Tim kiem va Bang bam.pdf",
    "pdf_pages": [
      105,
      106,
      107,
      108,
      109,
      110,
      111,
      112,
      113
    ],
    "kind": "V",
    "statement": "Cài lớp bảng băm gồm khởi tạo các bucket, hash(key), put(key,value), get(key). Thêm năm sách rồi truy xuất bucket của The Last Leaf.",
    "source_data": "Nguồn get trả cả bucket: [Beauty and the Beast, The Last Leaf].",
    "notes": "Đây là mô hình bucket đơn giản; không tự mô tả như map tra cứu chính xác từng cặp key-value nếu code nguồn chỉ trả danh sách bucket."
  }
];
