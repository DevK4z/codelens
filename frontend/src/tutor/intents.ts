// Training data for the tutor's question classifier: how learners ask each kind of question.
// Add phrasings here when the tutor misunderstands one; tutor.test.ts checks held-out wording.

export type Intent =
  | 'greeting' | 'capabilities' | 'thanks'
  | 'explain_step' | 'why_step' | 'next_step' | 'variable_value' | 'variable_history' | 'loop_progress'
  | 'complexity' | 'algorithm_idea' | 'concept' | 'find_bug' | 'output' | 'exercise_help'
  | 'more' | 'reveal';

export const INTENT_EXAMPLES: Record<Intent, string[]> = {
  greeting: ['xin chào', 'chào bạn', 'hello', 'hi', 'chào trợ lý', 'alo', 'chào buổi sáng', 'hế lô'],
  capabilities: [
    'bạn làm được gì', 'bạn giúp được gì', 'bạn có thể làm gì', 'hướng dẫn dùng trợ lý', 'mình nên hỏi gì',
    'trợ lý này dùng thế nào', 'bạn biết những gì', 'giới thiệu về bạn', 'bạn là ai', 'có thể hỏi những câu nào',
  ],
  thanks: ['cảm ơn', 'cảm ơn bạn', 'thanks', 'thank you', 'ok cảm ơn nhiều', 'hiểu rồi cảm ơn', 'tuyệt cảm ơn', 'cám ơn nha'],
  explain_step: [
    'dòng này làm gì', 'bước này làm gì', 'giải thích bước này', 'giải thích dòng này', 'đoạn này đang làm gì',
    'chuyện gì đang xảy ra', 'bây giờ chương trình đang làm gì', 'dòng đang tô sáng nghĩa là gì', 'câu lệnh này có tác dụng gì',
    'giải thích giúp mình bước hiện tại', 'đang chạy tới đâu rồi', 'dòng này có ý nghĩa gì', 'lệnh này làm gì vậy',
    'giải thích dòng 5', 'dòng 12 làm gì',
  ],
  why_step: [
    'tại sao', 'vì sao lại làm vậy', 'tại sao lại đổi chỗ', 'vì sao điều kiện sai', 'tại sao lại vào if', 'sao lại bỏ nửa trái',
    'vì sao left tăng', 'tại sao phải dùng biến tạm', 'tại sao lại gọi đệ quy', 'mục đích của bước này là gì', 'bước này để làm gì',
    'sao không đổi chỗ', 'vì sao vòng lặp dừng', 'tại sao lại so sánh hai phần tử này', 'lý do của bước này',
  ],
  next_step: [
    'tiếp theo sẽ làm gì', 'bước sau là gì', 'sau dòng này chạy đến đâu', 'tiếp theo chạy dòng nào', 'kế tiếp sẽ xảy ra gì',
    'bước tiếp theo', 'sau đó thì sao', 'chương trình sẽ đi đâu tiếp', 'rồi sao nữa', 'sắp tới làm gì', 'bước kế là gì', 'kế tiếp chạy gì',
  ],
  variable_value: [
    'biến i bằng bao nhiêu', 'giá trị của mid là gì', 'sum đang là bao nhiêu', 'mảng a hiện tại thế nào', 'left và right bằng mấy',
    'n bằng bao nhiêu', 'cho mình xem giá trị các biến', 'biến nào đang có giá trị gì', 'arr đang chứa gì', 'giá trị hiện tại của biến',
    'kết quả của biến result', 'temp đang giữ số mấy', 'dp hiện tại ra sao',
    'lúc này j bằng mấy', 'hiện giờ x là bao nhiêu', 'bây giờ mảng trông thế nào', 'biến k lúc này là mấy',
  ],
  variable_history: [
    'i thay đổi thế nào', 'giá trị của sum thay đổi ra sao', 'lịch sử của biến left', 'khi nào mid thay đổi', 'biến x đã thay đổi bao nhiêu lần',
    'theo dõi biến i qua các bước', 'sum tăng dần thế nào', 'mảng thay đổi qua từng bước ra sao', 'ban đầu biến này bằng mấy',
    'giá trị trước đó của right', 'right đã giảm như thế nào',
  ],
  loop_progress: [
    'vòng lặp chạy mấy lần', 'đang ở lần lặp thứ mấy', 'vòng lặp còn bao nhiêu lần', 'vòng for này lặp bao nhiêu lần', 'khi nào vòng lặp dừng',
    'lần lặp hiện tại là lần thứ mấy', 'vòng while chạy bao lâu', 'còn mấy vòng nữa', 'vòng lặp này kết thúc khi nào', 'đã lặp được mấy lần',
  ],
  complexity: [
    'độ phức tạp là bao nhiêu', 'big o của thuật toán này', 'thuật toán này chạy nhanh không', 'độ phức tạp thời gian', 'tốn bao nhiêu bộ nhớ',
    'o n bình phương hay o n log n', 'độ phức tạp không gian', 'chạy mất bao lâu với n lớn', 'tại sao lại là o log n',
    'tính độ phức tạp của code này', 'trường hợp xấu nhất là gì', 'trường hợp tốt nhất', 'có tối ưu được không',
  ],
  algorithm_idea: [
    'thuật toán này là gì', 'code này làm gì', 'ý tưởng của thuật toán', 'chương trình này giải bài gì', 'đây là thuật toán gì',
    'tóm tắt cách hoạt động', 'giải thích toàn bộ code', 'thuật toán này hoạt động như thế nào', 'cách tiếp cận của code',
    'giải thích ý tưởng chính', 'code này dùng kỹ thuật gì',
  ],
  concept: [
    'đệ quy là gì', 'quy hoạch động là gì', 'stack là gì', 'queue hoạt động thế nào', 'cây nhị phân tìm kiếm là gì',
    'bảng băm là gì', 'danh sách liên kết là gì', 'tham lam là gì', 'quick sort hoạt động ra sao', 'merge sort là gì',
    'giải thích tìm kiếm nhị phân', 'phân biệt stack và queue', 'khái niệm quay lui', 'thế nào là ký pháp hậu tố',
    'duyệt cây lnr là gì', 'insertion sort khác selection sort chỗ nào', 'big o là gì', 'hai con trỏ là gì', 'lis là gì', 'bài toán ba lô',
  ],
  find_bug: [
    'code có lỗi không', 'sai ở đâu', 'tại sao kết quả sai', 'kiểm tra lỗi giúp mình', 'tại sao chương trình bị crash',
    'có truy cập ngoài mảng không', 'vì sao ra kết quả không đúng', 'code mình bị lỗi gì', 'tìm bug', 'tại sao bị lặp vô hạn',
    'có vấn đề gì với code không', 'sao chương trình chạy không ra', 'lỗi segmentation fault là gì', 'tại sao ra số rác',
  ],
  output: [
    'chương trình in ra gì', 'kết quả là gì', 'output là bao nhiêu', 'in ra màn hình cái gì', 'đáp án cuối cùng là gì',
    'chạy xong ra kết quả gì', 'stdout là gì', 'kết quả cuối cùng', 'chương trình xuất ra gì',
  ],
  exercise_help: [
    'gợi ý bài này', 'làm bài này thế nào', 'mình bí bài này', 'hướng làm bài tập', 'bắt đầu từ đâu', 'bài này nên dùng thuật toán gì',
    'gợi ý cho mình với', 'cho mình hướng giải', 'không biết làm bài này', 'em không nghĩ ra cách làm', 'bài này giải sao', 'có gợi ý không',
  ],
  more: [
    'giải thích rõ hơn', 'chưa hiểu', 'nói thêm đi', 'tiếp đi', 'cụ thể hơn được không', 'mình vẫn chưa hiểu', 'gợi ý thêm',
    'nữa đi', 'rồi sao', 'chi tiết hơn', 'không hiểu lắm', 'ví dụ cụ thể', 'thêm gợi ý nữa', 'gợi ý tiếp đi', 'cho thêm một gợi ý',
  ],
  reveal: [
    'cho mình đáp án', 'nói luôn đi', 'giải thích thẳng luôn', 'cho xem lời giải', 'mình chịu rồi', 'đáp án là gì vậy',
    'nói thẳng ra đi', 'trả lời luôn', 'không đoán được nói đi', 'bỏ qua gợi ý',
  ],
};
