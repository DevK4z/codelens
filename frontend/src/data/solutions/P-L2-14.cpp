#include <iostream>
#include <string>
using namespace std;

// In s[i], s[i-1], …, s[0]: in ký tự hiện tại rồi gọi đệ quy cho phần đứng trước nó.
void printReversed(const string& s, int i) {
    if (i < 0) return;
    cout << s[i];
    printReversed(s, i - 1);
}

int main() {
    string s;
    getline(cin, s);
    if (!s.empty() && s.back() == '\r') s.pop_back();   // dữ liệu có thể kết thúc bằng CRLF
    printReversed(s, (int)s.size() - 1);
    cout << '\n';
    return 0;
}
