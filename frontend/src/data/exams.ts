// Đề thi riêng cho chế độ "Làm bài thi". Các bài ở đây KHÔNG trùng với ngân hàng 104 bài tập
// (exercises.ts) hay bài mẫu (samples.ts): đồ thị/lưới, Kadane, ngoặc hợp lệ, đảo DSLK, heap, AVL...

export interface ChoiceQuestion {
  id: string;
  prompt: string;
  code?: string;
  options: string[];
  answer: number; // chỉ số đáp án đúng trong options
  points: number;
  explanation: string;
}

export interface ExamTestCase {
  input: string;
  output: string;
  hidden: boolean; // true: không hiển thị trong đề, chỉ dùng khi chấm
}

export interface CodeProblem {
  id: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  points: number;
  starterCode: string;
  tests: ExamTestCase[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  maxViolations: number;
  questions: ChoiceQuestion[];
  problems: CodeProblem[];
}

const STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Viết lời giải ở đây

    return 0;
}`;

export const EXAMS: Exam[] = [
  {
    id: 'exam-a',
    title: 'Đề A — Kiểm tra giữa kỳ CTDL & GT',
    description: '8 câu trắc nghiệm (4 điểm) và 3 bài lập trình (6 điểm): đệ quy, ngăn xếp, danh sách liên kết.',
    durationMinutes: 45,
    maxViolations: 3,
    questions: [
      {
        id: 'A-Q1', points: 0.5,
        prompt: 'Độ phức tạp thời gian của đoạn code sau là gì?',
        code: 'for (int i = 1; i < n; i *= 2)\n    for (int j = 0; j < i; j++)\n        cnt++;',
        options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
        answer: 1,
        explanation: 'Tổng số lần lặp là 1 + 2 + 4 + ... + 2^k < 2n, nên là O(n).',
      },
      {
        id: 'A-Q2', points: 0.5,
        prompt: 'Cài đặt hàng đợi (queue) bằng hai ngăn xếp (stack). Chi phí khấu hao (amortized) của mỗi thao tác enqueue/dequeue là:',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        answer: 0,
        explanation: 'Mỗi phần tử được đẩy vào và lấy ra khỏi mỗi stack tối đa một lần, nên chi phí khấu hao là O(1).',
      },
      {
        id: 'A-Q3', points: 0.5,
        prompt: 'Lần lượt chèn 5, 3, 8, 1 vào một min-heap rỗng (lưu bằng mảng, có vun lên sau mỗi lần chèn). Mảng heap cuối cùng là:',
        options: ['[1, 3, 5, 8]', '[1, 3, 8, 5]', '[1, 5, 8, 3]', '[3, 1, 8, 5]'],
        answer: 1,
        explanation: '[5] → [3,5] → [3,5,8] → chèn 1 vào cuối: [3,5,8,1], đổi với 5 rồi với 3 → [1,3,8,5].',
      },
      {
        id: 'A-Q4', points: 0.5,
        prompt: 'Thuật toán sắp xếp nào dưới đây là ổn định (stable) khi cài đặt chuẩn?',
        options: ['Quick Sort (phân hoạch Lomuto)', 'Heap Sort', 'Selection Sort', 'Merge Sort'],
        answer: 3,
        explanation: 'Merge Sort giữ thứ tự tương đối của các phần tử bằng nhau nếu khi trộn ưu tiên lấy dãy bên trái.',
      },
      {
        id: 'A-Q5', points: 0.5,
        prompt: 'Hàm sau trả về giá trị bao nhiêu khi gọi f(13)?',
        code: 'int f(int n) {\n    if (n <= 1) return n;\n    return f(n / 2) + n % 2;\n}',
        options: ['3', '4', '6', '13'],
        answer: 0,
        explanation: 'f đếm số bit 1 trong biểu diễn nhị phân. 13 = 1101₂ có 3 bit 1.',
      },
      {
        id: 'A-Q6', points: 0.5,
        prompt: 'Trên đồ thị vô hướng KHÔNG có trọng số, thuật toán nào tìm được đường đi ngắn nhất (theo số cạnh) từ một đỉnh nguồn?',
        options: ['DFS', 'BFS', 'Sắp xếp tô-pô', 'Thuật toán Prim'],
        answer: 1,
        explanation: 'BFS duyệt theo từng lớp khoảng cách nên lần đầu chạm tới một đỉnh chính là đường đi ít cạnh nhất.',
      },
      {
        id: 'A-Q7', points: 0.5,
        prompt: 'Bảng băm kích thước 7, h(k) = k mod 7, xử lý đụng độ bằng dò tuyến tính. Chèn lần lượt 10, 17, 24. Khóa 24 nằm ở ô số mấy?',
        options: ['3', '4', '5', '6'],
        answer: 2,
        explanation: '10 → ô 3; 17 → ô 3 bận, sang ô 4; 24 → ô 3, 4 bận, sang ô 5.',
      },
      {
        id: 'A-Q8', points: 0.5,
        prompt: 'Chiều cao nhỏ nhất của một cây nhị phân có 100 nút là bao nhiêu (cây chỉ có gốc có chiều cao 1)?',
        options: ['6', '7', '8', '50'],
        answer: 1,
        explanation: 'Cây cao h chứa tối đa 2^h − 1 nút. 2^6 − 1 = 63 < 100 ≤ 127 = 2^7 − 1, nên h nhỏ nhất là 7.',
      },
    ],
    problems: [
      {
        id: 'A-P1', points: 2,
        title: 'Tổng các chữ số (đệ quy)',
        statement: 'Cho số nguyên không âm n. Hãy viết hàm ĐỆ QUY tính tổng các chữ số của n.',
        inputFormat: 'Một dòng chứa số nguyên n.',
        outputFormat: 'Một số nguyên là tổng các chữ số của n.',
        constraints: '0 ≤ n ≤ 10^18',
        starterCode: STARTER,
        tests: [
          { input: '12345\n', output: '15', hidden: false },
          { input: '0\n', output: '0', hidden: false },
          { input: '999999999999999999\n', output: '162', hidden: true },
          { input: '1000000\n', output: '1', hidden: true },
          { input: '7\n', output: '7', hidden: true },
        ],
      },
      {
        id: 'A-P2', points: 2,
        title: 'Dãy ngoặc hợp lệ',
        statement: 'Cho xâu s chỉ gồm các ký tự ( ) [ ] { }. Xâu được gọi là hợp lệ nếu mỗi ngoặc mở được đóng bởi đúng loại ngoặc tương ứng và theo đúng thứ tự. Hãy dùng ngăn xếp để kiểm tra s có hợp lệ hay không.',
        inputFormat: 'Một dòng chứa xâu s (không có khoảng trắng).',
        outputFormat: 'In YES nếu s hợp lệ, ngược lại in NO.',
        constraints: '1 ≤ |s| ≤ 10^5',
        starterCode: STARTER,
        tests: [
          { input: '()[]{}\n', output: 'YES', hidden: false },
          { input: '([)]\n', output: 'NO', hidden: false },
          { input: '{[()()]}\n', output: 'YES', hidden: true },
          { input: '(((\n', output: 'NO', hidden: true },
          { input: ')(\n', output: 'NO', hidden: true },
          { input: '{[]}(\n', output: 'NO', hidden: true },
        ],
      },
      {
        id: 'A-P3', points: 2,
        title: 'Đảo ngược danh sách liên kết đơn',
        statement: 'Đọc n số nguyên và lần lượt thêm vào CUỐI một danh sách liên kết đơn. Sau đó đảo ngược danh sách bằng cách đổi con trỏ next (không dùng mảng phụ) và in danh sách sau khi đảo.',
        inputFormat: 'Dòng 1: số nguyên n. Dòng 2: n số nguyên a₁ … aₙ.',
        outputFormat: 'Một dòng gồm n số của danh sách sau khi đảo, cách nhau bởi một dấu cách.',
        constraints: '1 ≤ n ≤ 10^5; |aᵢ| ≤ 10^9',
        starterCode: STARTER,
        tests: [
          { input: '5\n1 2 3 4 5\n', output: '5 4 3 2 1', hidden: false },
          { input: '1\n42\n', output: '42', hidden: false },
          { input: '3\n-1 0 -1\n', output: '-1 0 -1', hidden: true },
          { input: '6\n10 -20 30 -40 50 1000000000\n', output: '1000000000 50 -40 30 -20 10', hidden: true },
          { input: '2\n7 8\n', output: '8 7', hidden: true },
        ],
      },
    ],
  },
  {
    id: 'exam-b',
    title: 'Đề B — Kiểm tra cuối kỳ (nâng cao)',
    description: '8 câu trắc nghiệm (4 điểm) và 3 bài lập trình (6 điểm): quy hoạch động, tìm kiếm nhị phân, duyệt đồ thị trên lưới.',
    durationMinutes: 60,
    maxViolations: 3,
    questions: [
      {
        id: 'B-Q1', points: 0.5,
        prompt: 'Thuật toán Dijkstra có thể cho kết quả SAI khi đồ thị:',
        options: ['Có chu trình', 'Có cạnh trọng số âm', 'Là đồ thị có hướng', 'Có nhiều thành phần liên thông'],
        answer: 1,
        explanation: 'Dijkstra giả định khi một đỉnh được chốt thì khoảng cách không giảm nữa, điều này sai khi có cạnh âm.',
      },
      {
        id: 'B-Q2', points: 0.5,
        prompt: 'Nghiệm của hệ thức truy hồi T(n) = 2T(n/2) + n là:',
        options: ['Θ(n)', 'Θ(n log n)', 'Θ(n²)', 'Θ(log n)'],
        answer: 1,
        explanation: 'Theo định lý Master (trường hợp 2): a = 2, b = 2, f(n) = n = n^(log₂2) ⇒ Θ(n log n).',
      },
      {
        id: 'B-Q3', points: 0.5,
        prompt: 'Chèn lần lượt 1, 2, 3 vào một cây AVL rỗng. Sau khi cân bằng, nút gốc là:',
        options: ['1', '2', '3', 'Cây không cần cân bằng'],
        answer: 1,
        explanation: 'Sau khi chèn 3, nút 1 lệch phải 2 mức (trường hợp RR) → quay trái tại 1, gốc mới là 2.',
      },
      {
        id: 'B-Q4', points: 0.5,
        prompt: 'Cấu trúc Disjoint Set Union dùng nén đường đi + hợp theo hạng có chi phí khấu hao mỗi thao tác là:',
        options: ['O(1) tuyệt đối', 'O(α(n)) — hàm Ackermann ngược', 'O(log n)', 'O(√n)'],
        answer: 1,
        explanation: 'Kết hợp hai kỹ thuật cho chi phí khấu hao O(α(n)), gần như hằng số trong thực tế.',
      },
      {
        id: 'B-Q5', points: 0.5,
        prompt: 'Đoạn code sau in ra gì?',
        code: 'int a[] = {1, 2, 3, 4, 5};\nint *p = a + 1;\ncout << *(p + 2) + p[-1];',
        options: ['4', '5', '6', '7'],
        answer: 1,
        explanation: 'p trỏ a[1]. *(p+2) = a[3] = 4, p[-1] = a[0] = 1 ⇒ 5.',
      },
      {
        id: 'B-Q6', points: 0.5,
        prompt: 'Sắp xếp tô-pô (topological sort) chỉ tồn tại khi đồ thị là:',
        options: ['Đồ thị vô hướng liên thông', 'Đồ thị có hướng không chu trình (DAG)', 'Cây nhị phân', 'Đồ thị đầy đủ'],
        answer: 1,
        explanation: 'Nếu có chu trình có hướng thì không thể xếp các đỉnh sao cho mọi cung đi từ trước ra sau.',
      },
      {
        id: 'B-Q7', points: 0.5,
        prompt: 'Thời gian tra cứu một xâu độ dài L trong cây Trie chứa N xâu là:',
        options: ['O(L)', 'O(log N)', 'O(N·L)', 'O(L log N)'],
        answer: 0,
        explanation: 'Trie đi từ gốc xuống theo từng ký tự, không phụ thuộc số xâu N.',
      },
      {
        id: 'B-Q8', points: 0.5,
        prompt: 'Dùng cửa sổ trượt, tổng lớn nhất của một đoạn con liên tiếp độ dài 3 trong dãy [2, 1, 5, 1, 3, 2] là:',
        options: ['8', '9', '10', '7'],
        answer: 1,
        explanation: 'Các cửa sổ: 2+1+5=8, 1+5+1=7, 5+1+3=9, 1+3+2=6 ⇒ lớn nhất là 9.',
      },
    ],
    problems: [
      {
        id: 'B-P1', points: 2,
        title: 'Đoạn con có tổng lớn nhất',
        statement: 'Cho dãy n số nguyên. Tìm tổng lớn nhất của một đoạn con liên tiếp KHÁC RỖNG. Yêu cầu thuật toán O(n) (gợi ý: quy hoạch động / Kadane).',
        inputFormat: 'Dòng 1: số nguyên n. Dòng 2: n số nguyên a₁ … aₙ.',
        outputFormat: 'Một số nguyên là tổng lớn nhất.',
        constraints: '1 ≤ n ≤ 2·10^5; |aᵢ| ≤ 10^9 (chú ý tràn số)',
        starterCode: STARTER,
        tests: [
          { input: '9\n-2 1 -3 4 -1 2 1 -5 4\n', output: '6', hidden: false },
          { input: '3\n-5 -2 -9\n', output: '-2', hidden: false },
          { input: '1\n7\n', output: '7', hidden: true },
          { input: '4\n1000000000 1000000000 1000000000 1000000000\n', output: '4000000000', hidden: true },
          { input: '6\n3 -1 -1 3 -10 5\n', output: '5', hidden: true },
        ],
      },
      {
        id: 'B-P2', points: 2,
        title: 'Đếm số lần xuất hiện trong dãy đã sắp xếp',
        statement: 'Cho dãy n số nguyên đã sắp xếp không giảm và q truy vấn. Với mỗi truy vấn x, hãy in số lần x xuất hiện trong dãy. Mỗi truy vấn phải xử lý trong O(log n) bằng tìm kiếm nhị phân (tìm cận trái và cận phải).',
        inputFormat: 'Dòng 1: n và q. Dòng 2: n số nguyên đã sắp xếp. Dòng 3: q số nguyên x.',
        outputFormat: 'q dòng, dòng thứ i là đáp án cho truy vấn thứ i.',
        constraints: '1 ≤ n, q ≤ 2·10^5; |aᵢ|, |x| ≤ 10^9',
        starterCode: STARTER,
        tests: [
          { input: '8 3\n1 2 2 2 3 5 5 9\n2 5 4\n', output: '3\n2\n0', hidden: false },
          { input: '1 2\n7\n7 8\n', output: '1\n0', hidden: false },
          { input: '5 3\n4 4 4 4 4\n4 3 5\n', output: '5\n0\n0', hidden: true },
          { input: '6 2\n-3 -3 0 1 1 1\n-3 1\n', output: '2\n3', hidden: true },
          { input: '4 4\n-1000000000 0 0 1000000000\n-1000000000 0 1000000000 1\n', output: '1\n2\n1\n0', hidden: true },
        ],
      },
      {
        id: 'B-P3', points: 2,
        title: 'Đếm số hòn đảo',
        statement: 'Bản đồ là lưới n × m gồm ký tự 1 (đất) và 0 (nước). Một hòn đảo là một nhóm ô đất liên thông theo 4 hướng (lên, xuống, trái, phải). Hãy đếm số hòn đảo bằng BFS hoặc DFS.',
        inputFormat: 'Dòng 1: n và m. n dòng tiếp theo, mỗi dòng là xâu độ dài m gồm 0 và 1.',
        outputFormat: 'Một số nguyên là số hòn đảo.',
        constraints: '1 ≤ n, m ≤ 1000',
        starterCode: STARTER,
        tests: [
          { input: '4 5\n11000\n11000\n00100\n00011\n', output: '3', hidden: false },
          { input: '3 3\n101\n010\n101\n', output: '5', hidden: false },
          { input: '1 1\n0\n', output: '0', hidden: true },
          { input: '3 4\n1111\n1001\n1111\n', output: '1', hidden: true },
          { input: '2 2\n11\n11\n', output: '1', hidden: true },
          { input: '3 5\n10101\n00000\n10101\n', output: '6', hidden: true },
        ],
      },
    ],
  },
];

export function examTotalPoints(exam: Exam): number {
  return [...exam.questions, ...exam.problems].reduce((sum, item) => sum + item.points, 0);
}
