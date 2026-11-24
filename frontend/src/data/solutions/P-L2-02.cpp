#include <iostream>
#include <string>
using namespace std;

int n;
string cur;

void generate(int open, int close) {
    if ((int)cur.size() == 2 * n) { cout << cur << "\n"; return; }
    if (open < n) {
        cur.push_back('(');
        generate(open + 1, close);
        cur.pop_back();
    }
    if (close < open) {   // chỉ đóng khi có ngoặc mở đang chờ
        cur.push_back(')');
        generate(open, close + 1);
        cur.pop_back();
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    generate(0, 0);
    return 0;
}
