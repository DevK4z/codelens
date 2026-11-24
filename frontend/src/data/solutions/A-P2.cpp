#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s;
    cin >> s;

    stack<char> st;
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
            continue;
        }
        char open = (c == ')') ? '(' : (c == ']') ? '[' : '{';
        if (st.empty() || st.top() != open) { ok = false; break; }  // đóng sai loại hoặc thừa
        st.pop();
    }
    cout << (ok && st.empty() ? "YES" : "NO") << "\n";             // còn ngoặc mở chưa đóng → sai
    return 0;
}
