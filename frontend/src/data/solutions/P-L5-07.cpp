#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<int> counts;          // số lần lặp của từng mức ngoặc đang mở
    stack<string> outer;        // phần xâu đã xây ở ngoài mỗi mức ngoặc
    string cur;
    int k = 0;
    for (char c : s) {
        if (c >= '0' && c <= '9') {
            k = k * 10 + (c - '0');
        } else if (c == '[') {
            counts.push(k);
            outer.push(cur);
            cur.clear();
            k = 0;
        } else if (c == ']') {
            string inner = cur;
            cur = outer.top();
            outer.pop();
            for (int i = counts.top(); i > 0; i--) cur += inner;
            counts.pop();
        } else {
            cur += c;
        }
    }
    cout << cur << '\n';
    return 0;
}
