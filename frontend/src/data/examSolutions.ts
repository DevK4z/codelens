// Ghi chú cho lời giải tối ưu của từng bài thi. Mã nguồn nằm trong solutions/<id>.cpp và chỉ được
// tải khi xem lại bài (sau khi nộp hoặc trong lịch sử), không có trong trang lúc đang thi.
// exams.test.ts biên dịch từng file .cpp và chạy với mọi test của bài.

export interface SolutionNote {
  idea: string;
  time: string;
  space: string;
}

export const SOLUTION_NOTES: Record<string, SolutionNote> = {
  "A-P1": { idea: "Tổng chữ số của n bằng chữ số cuối (n % 10) cộng tổng chữ số của phần còn lại (n / 10); dừng khi n chỉ còn một chữ số. Dùng unsigned long long vì n có thể tới 10^18.", time: "O(số chữ số) = O(log n)", space: "O(log n) cho ngăn xếp đệ quy" },
  "A-P2": { idea: "Duyệt từng ký tự: gặp ngoặc mở thì đẩy vào stack; gặp ngoặc đóng thì đỉnh stack phải là ngoặc mở cùng loại (rồi pop), nếu stack rỗng hoặc khác loại thì sai. Cuối cùng stack phải rỗng.", time: "O(|s|)", space: "O(|s|)" },
  "A-P3": { idea: "Giữ ba con trỏ prev, cur, next. Với mỗi nút: lưu next = cur->next, đảo cur->next = prev, rồi tiến prev = cur, cur = next. Khi cur = nullptr thì prev là đầu danh sách mới. Không cần mảng phụ.", time: "O(n)", space: "O(1) ngoài các nút của danh sách" },
  "B-P1": { idea: "Kadane: cur là tổng lớn nhất của đoạn con KẾT THÚC tại vị trí i, cur = max(a[i], cur + a[i]) — hoặc bắt đầu lại từ a[i], hoặc nối tiếp đoạn trước. Đáp án là max mọi cur. Dùng long long vì tổng có thể tới 2·10^14.", time: "O(n)", space: "O(1)" },
  "B-P2": { idea: "Số lần x xuất hiện = (vị trí đầu tiên > x) − (vị trí đầu tiên ≥ x). Hai vị trí này tìm bằng tìm kiếm nhị phân: upper_bound và lower_bound.", time: "O(n + q·log n)", space: "O(n)" },
  "B-P3": { idea: "Duyệt mọi ô; gặp ô đất chưa thăm thì tăng số đảo và loang BFS bằng hàng đợi sang 4 ô kề, đánh dấu ô đã thăm bằng cách đổi thành nước. Mỗi ô vào hàng đợi tối đa một lần.", time: "O(n·m)", space: "O(n·m)" },
  "P-L1-01": { idea: "Tính mảng cộng dồn p[i] = a[1] + … + a[i] (p[0] = 0). Tổng đoạn [l, r] = p[r] − p[l−1], trả lời mỗi truy vấn trong O(1).", time: "O(n + q)", space: "O(n)" },
  "P-L1-02": { idea: "Sàng Eratosthenes: với mỗi số nguyên tố i (từ 2, chỉ cần tới √n), gạch các bội i·i, i·i + i, … là hợp số. Những số còn lại là nguyên tố.", time: "O(n log log n)", space: "O(n)" },
  "P-L2-01": { idea: "Quay lui điền từng vị trí: luôn thử 0; chỉ thử 1 khi vị trí trước không phải 1. Thử 0 trước 1 nên các xâu tự ra đúng thứ tự từ điển, và không bao giờ đi vào nhánh sai.", time: "O(F(n+2)·n) — tỉ lệ với số xâu cần in", space: "O(n)" },
  "P-L2-02": { idea: "Quay lui với số ngoặc mở và đóng đã dùng: đặt \"(\" khi còn ngoặc mở (open < n), đặt \")\" khi đóng được (close < open). Thử \"(\" trước nên kết quả theo thứ tự từ điển; mọi nhánh đều cho ra một dãy đúng.", time: "O(C(n)·n) với C(n) là số Catalan — tỉ lệ với số dãy cần in", space: "O(n)" },
  "P-L2-03": { idea: "Chia để trị: a^b = (a^(b/2))², nhân thêm a nếu b lẻ. Mỗi lần gọi b giảm một nửa. Lấy modulo sau mỗi phép nhân; vì m ≤ 10^9 nên tích hai số < m vẫn vừa long long. Chú ý m = 1 thì kết quả là 0.", time: "O(log b)", space: "O(log b) cho ngăn xếp đệ quy" },
  "P-L31-01": { idea: "f(i) = số cách lên bậc i = f(i−1) + f(i−2) + f(i−3) (bước cuối dài 1, 2 hoặc 3), f(0) = 1. Chỉ cần giữ 3 giá trị gần nhất nên bộ nhớ O(1).", time: "O(n)", space: "O(1)" },
  "P-L31-02": { idea: "dp[x] = số đồng ít nhất để đổi đúng x; dp[0] = 0, dp[x] = min(dp[x − c] + 1) với mọi mệnh giá c ≤ x. Ô không đạt được giữ giá trị vô cực và in −1.", time: "O(n·S)", space: "O(S)" },
  "P-L31-03": { idea: "d[i][j] = số thao tác ít nhất biến A[0..i) thành B[0..j). Nếu A[i−1] = B[j−1] thì d[i][j] = d[i−1][j−1]; ngược lại là 1 + min(xóa d[i−1][j], chèn d[i][j−1], thay d[i−1][j−1]). Hàng i chỉ cần hàng i−1 nên giữ hai hàng.", time: "O(|A|·|B|)", space: "O(|B|)" },
  "P-L32-01": { idea: "Khách ở vị trí k phải chờ tổng thời gian của k người trước, nên thời gian phục vụ của người đứng trước bị cộng nhiều lần. Phục vụ người nhanh trước (sắp tăng dần) là tối ưu, chứng minh bằng lập luận hoán đổi.", time: "O(n log n)", space: "O(n)" },
  "P-L32-02": { idea: "Sắp cân nặng tăng dần, hai con trỏ ở hai đầu. Người nặng nhất luôn cần một thuyền; cho người nhẹ nhất đi cùng nếu tổng ≤ W (nếu người nhẹ nhất không đi cùng được thì không ai đi cùng được).", time: "O(n log n)", space: "O(n)" },
  "P-L32-03": { idea: "Sắp các đoạn theo đầu mút phải. Đoạn kết thúc sớm nhất chưa có điểm thì phải đóng một điểm bên trong nó; chọn đúng đầu mút phải của nó để phủ được nhiều đoạn sau nhất.", time: "O(n log n)", space: "O(n)" },
  "P-L4-01": { idea: "Danh sách đã sắp nên các giá trị trùng nằm liền nhau. Đi từ đầu: nếu nút kế tiếp bằng nút hiện tại thì nối qua nó và giải phóng nó (không tiến); ngược lại tiến sang nút kế.", time: "O(n)", space: "O(1) ngoài các nút" },
  "P-L4-02": { idea: "Dùng nút giả (dummy) làm đầu danh sách kết quả. So đầu hai danh sách, nối nút nhỏ hơn (≤ để giữ thứ tự ổn định) vào cuối kết quả và tiến danh sách đó. Hết một danh sách thì nối nguyên phần còn lại của danh sách kia.", time: "O(n + m)", space: "O(1) — không tạo nút mới" },
  "P-L4-03": { idea: "Nối n người thành danh sách liên kết vòng, giữ con trỏ tới nút ĐỨNG TRƯỚC người sắp đếm. Mỗi lượt tiến k−1 bước, người kế tiếp là người bị loại: nối qua và xóa nút đó. (Nếu chỉ cần người sống sót cuối cùng thì có công thức truy hồi O(n): J(i) = (J(i−1) + k) mod i.)", time: "O(n·k)", space: "O(n)" },
  "P-L5-01": { idea: "Stack đơn điệu chứa chỉ số các phần tử CHƯA tìm được đáp án, giá trị giảm dần từ đáy lên đỉnh. Gặp a[i]: mọi phần tử nhỏ hơn a[i] trên đỉnh stack có đáp án là a[i] → pop. Mỗi chỉ số vào và ra stack một lần.", time: "O(n)", space: "O(n)" },
  "P-L5-02": { idea: "Mỗi ô là một đỉnh, mỗi nước đi của mã là một cạnh không trọng số, nên BFS từ ô xuất phát cho số bước ít nhất. Dừng ngay khi lấy ra ô đích; ô không bao giờ được thăm thì in −1.", time: "O(n²)", space: "O(n²)" },
  "P-L6-01": { idea: "Chèn lần lượt các khóa vào BST (nhỏ hơn sang trái, lớn hơn sang phải), rồi duyệt hậu tự: cây con trái → cây con phải → gốc.", time: "O(n·h), h là chiều cao cây (tệ nhất O(n²) khi dãy đã sắp)", space: "O(n)" },
  "P-L6-02": { idea: "Trong BST, nếu u và v cùng nhỏ hơn khóa hiện tại thì cả hai nằm ở cây con trái; cùng lớn hơn thì ở cây con phải; còn lại (tách về hai phía hoặc trùng nút hiện tại) thì nút hiện tại chính là tổ tiên chung gần nhất.", time: "O(n·h) để dựng cây + O(h) mỗi truy vấn", space: "O(n)" },
  "P-L6-03": { idea: "Duyệt theo mức (BFS) bằng hàng đợi: ở mỗi vòng, số phần tử đang có trong hàng đợi đúng bằng số nút của mức hiện tại; cộng khóa của chúng và đưa các con vào hàng đợi cho mức sau.", time: "O(n·h) để dựng cây + O(n) để duyệt", space: "O(n)" },
  "P-L7-01": { idea: "Đề yêu cầu mô phỏng đúng Selection Sort: ở lượt i tìm chỉ số nhỏ nhất của phần tử nhỏ nhất trong a[i..n−1] (so sánh \"<\" nên lấy vị trí đầu tiên), đổi chỗ chỉ khi khác i và đếm số lần đổi.", time: "O(n²) — bản chất của Selection Sort", space: "O(n)" },
  "P-L7-02": { idea: "Đếm tần suất bằng bảng băm, rồi sắp xếp với hàm so sánh: tần suất lớn hơn đứng trước, cùng tần suất thì giá trị nhỏ hơn đứng trước. Hàm so sánh tra tần suất O(1).", time: "O(n log n)", space: "O(n)" },
  "P-L7-03": { idea: "Không cần sắp xếp toàn bộ: nth_element (Quickselect) đặt đúng phần tử thứ k vào vị trí k−1 theo thứ tự giảm dần, trung bình O(n) — nhanh hơn sort O(n log n).", time: "O(n) trung bình", space: "O(n)" },
  "P-L8-01": { idea: "Lomuto: i là ranh giới cuối của vùng các phần tử ≤ pivot. Quét j từ trái sang; gặp a[j] ≤ pivot thì mở rộng vùng (i++) và đổi a[j] vào. Cuối cùng đưa pivot về ngay sau vùng đó, tại i + 1.", time: "O(n)", space: "O(1) ngoài mảng" },
  "P-L8-02": { idea: "Merge Sort cải tiến: khi trộn hai nửa đã sắp, mỗi lần lấy phần tử từ nửa phải (vì nó nhỏ hơn a[i]) thì nó tạo nghịch thế với mọi phần tử còn lại của nửa trái, tức (mid − i) cặp. Dùng long long vì số cặp có thể tới ~2·10^10.", time: "O(n log n)", space: "O(n)" },
  "P-L8-03": { idea: "Merge Sort ổn định: khi trộn, nếu hai điểm bằng nhau thì luôn lấy phần tử của nửa trái trước (so sánh ≥ cho thứ tự giảm dần), nên người đứng trước trong input vẫn đứng trước.", time: "O(n log n)", space: "O(n)" },
  "P-L9-01": { idea: "Duyệt từ trái sang, bảng băm đếm số lần mỗi giá trị đã xuất hiện. Với a[j], số cặp (i, j) mới bằng số lần K − a[j] đã xuất hiện trước đó. Mỗi cặp được đếm đúng một lần (tại phần tử bên phải).", time: "O(n) trung bình", space: "O(n)" },
  "P-L9-02": { idea: "Tìm kiếm nhị phân trên đáp án x ∈ [0, 10^9]: điều kiện \"x² ≤ n\" đúng với mọi x nhỏ và sai với mọi x lớn. Kiểm tra bằng mid ≤ n / mid thay vì mid·mid ≤ n để không tràn số.", time: "O(log n)", space: "O(1)" },
  "P-L9-03": { idea: "Đếm số lần xuất hiện bằng bảng băm trong một lượt, rồi duyệt bảng để lấy giá trị có tần suất lớn nhất, hòa thì lấy giá trị nhỏ hơn.", time: "O(n) trung bình", space: "O(n)" },
  "P-L1-03": { idea: "Vì mọi phần tử dương, khi mở rộng cửa sổ sang phải tổng chỉ tăng. Giữ cửa sổ [l, r]: thêm a[r]; nếu tổng > S thì bỏ dần a[l] cho tới khi tổng ≤ S. Mỗi chỉ số vào và ra cửa sổ đúng một lần.", time: "O(n)", space: "O(n)" },
  "P-L1-04": { idea: "Ước đi theo cặp (d, n/d) với d ≤ √n. Chỉ thử d từ 1 tới √n: mỗi d chia hết cho n đóng góp 2 ước, trừ khi d·d = n (chỉ 1 ước).", time: "O(√n)", space: "O(1)" },
  "P-L32-04": { idea: "Làm việc theo hạn chót tăng dần (Earliest Deadline First). Nếu hai việc kề nhau ngược hạn chót, đổi chỗ chúng không làm độ trễ lớn nhất tăng, nên thứ tự sắp theo hạn chót là tối ưu.", time: "O(n log n)", space: "O(n)" },
  "P-L6-04": { idea: "Mỗi nút phải nằm trong một khoảng mở (lo, hi) do tổ tiên quy định: đi sang trái thì khóa của nút cha thành cận trên, sang phải thì thành cận dưới. Chỉ so với con trực tiếp là chưa đủ (ví dụ một khóa sâu bên trái lớn hơn gốc).", time: "O(n)", space: "O(h) cho ngăn xếp đệ quy" },
  "P-L7-04": { idea: "Một hàm so sánh duy nhất: số chẵn đứng trước số lẻ; hai số chẵn thì tăng dần, hai số lẻ thì giảm dần. Kiểm tra chẵn bằng x % 2 == 0 (đúng cả với số âm, vì −3 % 2 = −1).", time: "O(n log n)", space: "O(n)" },
  "P-L8-04": { idea: "Hai con trỏ như bước trộn của Merge Sort: phần tử nhỏ hơn chỉ thuộc một dãy → đưa vào hợp; hai phần tử bằng nhau → đưa vào cả hợp và giao rồi tiến cả hai. Mỗi phần tử được xét một lần.", time: "O(n + m)", space: "O(n + m)" },
};
