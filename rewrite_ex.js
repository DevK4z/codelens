const fs = require('fs');

// The original JSON from the prompt.
const rawData = [
  {
    "id": "L1-01",
    "chapter": "L1",
    "title": "Phân tích độ phức tạp Bubble Sort",
    "source_file": "L1 - Gioi thieu.pdf",
    "pdf_pages": [16, 17],
    "kind": "V",
    "statement": "Phân tích thời gian của đoạn bubbleSort có hai vòng lặp lồng nhau trong hình trang 17.",
    "source_data": "Vòng ngoài i=n-1 về 0; vòng trong j=1..i; đổi A[j-1], A[j] khi sai thứ tự.",
    "notes": "Slide là ví dụ phân tích, không ghi một đề bài riêng. Mã trong ảnh bị cắt ở phần dưới; không tự nhận phần thiếu là mã gốc."
  },
  {
    "id": "L1-02",
    "chapter": "L1",
    "title": "Phân tích thuật toán nhân hai ma trận",
    "source_file": "L1 - Gioi thieu.pdf",
    "pdf_pages": [17],
    "kind": "V",
    "statement": "Phân tích thuật toán nhân cơ bản hai ma trận A, B kích thước n×n, dùng ba vòng lặp để tạo R=A×B.",
    "source_data": "R[i,j]=0; với k=0..n-1: R[i,j]+=A[i,k]*B[k,j].",
    "notes": ""
  },
  {
    "id": "L2-01",
    "chapter": "L2",
    "title": "Ước chung lớn nhất bằng đệ quy",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [6],
    "kind": "V",
    "statement": "Tìm UCLN của hai số nguyên dương bằng đệ quy trừ: nếu a=b trả a; nếu a>b gọi với (a-b,b); ngược lại gọi với (a,b-a).",
    "source_data": "",
    "notes": ""
  },
  {
    "id": "L2-02",
    "chapter": "L2",
    "title": "Giai thừa bằng đệ quy",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [6],
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
    "pdf_pages": [7],
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
    "pdf_pages": [8, 9],
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
    "pdf_pages": [10],
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
    "pdf_pages": [17],
    "kind": "G",
    "statement": "Liệt kê tất cả dãy nhị phân độ dài n.",
    "source_data": "n=3: 000,001,010,011,100,101,110,111.",
    "notes": "",
    "constraints": "n <= 20",
    "proposed_input": "3",
    "proposed_output": "000\n001\n010\n011\n100\n101\n110\n111",
    "solution_stdin": "3",
    "solution_code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, vector<int>& a, int i) {\n    if (i == n) {\n        for (int x : a) cout << x;\n        cout << \"\\n\";\n        return;\n    }\n    a[i] = 0;\n    gen(n, a, i + 1);\n    a[i] = 1;\n    gen(n, a, i + 1);\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> a(n);\n        gen(n, a, 0);\n    }\n    return 0;\n}"
  },
  {
    "id": "L2-07",
    "chapter": "L2",
    "title": "Liệt kê hoán vị",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [18],
    "kind": "G",
    "statement": "Liệt kê tất cả hoán vị độ dài n của các số 1..n.",
    "source_data": "n=3: 123,132,213,231,312,321. Dùng mảng đánh dấu các số đã chọn.",
    "notes": "",
    "constraints": "n <= 10",
    "proposed_input": "3",
    "proposed_output": "123\n132\n213\n231\n312\n321",
    "solution_stdin": "3",
    "solution_code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, vector<int>& a, vector<bool>& used, int i) {\n    if (i == n) {\n        for (int x : a) cout << x;\n        cout << \"\\n\";\n        return;\n    }\n    for (int v = 1; v <= n; v++) {\n        if (!used[v]) {\n            used[v] = true;\n            a[i] = v;\n            gen(n, a, used, i + 1);\n            used[v] = false;\n        }\n    }\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> a(n);\n        vector<bool> used(n + 1, false);\n        gen(n, a, used, 0);\n    }\n    return 0;\n}"
  },
  {
    "id": "L2-08",
    "chapter": "L2",
    "title": "Liệt kê tổ hợp",
    "source_file": "L2 - De quy - 1.pdf",
    "pdf_pages": [19],
    "kind": "G",
    "statement": "Liệt kê các tổ hợp chập k của n phần tử.",
    "source_data": "n=5, k=3. Điều kiện tăng x1<x2<...<xk.",
    "notes": "Danh sách minh họa trên slide thiếu 134,135,145; không dùng danh sách thiếu làm đáp án đầy đủ.",
    "constraints": "k <= n <= 20",
    "proposed_input": "5 3",
    "proposed_output": "123\n124\n125\n134\n135\n145\n234\n235\n245\n345",
    "solution_stdin": "5 3",
    "solution_code": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, int k, vector<int>& a, int i) {\n    if (i > k) {\n        for (int j = 1; j <= k; j++) cout << a[j];\n        cout << \"\\n\";\n        return;\n    }\n    for (int v = a[i-1] + 1; v <= n - k + i; v++) {\n        a[i] = v;\n        gen(n, k, a, i + 1);\n    }\n}\n\nint main() {\n    int n, k;\n    if (cin >> n >> k) {\n        vector<int> a(k + 1);\n        a[0] = 0;\n        gen(n, k, a, 1);\n    }\n    return 0;\n}"
  }
];

const fileContent = \`export interface ExerciseSource {
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

export const EXERCISES: ExerciseItem[] = \${JSON.stringify(rawData, null, 2)};
\`;

fs.writeFileSync('frontend/src/data/exercises.ts', fileContent);
console.log('Done writing exercises.ts');
