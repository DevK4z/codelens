#include <algorithm>
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> h(n + 1, 0);   // thêm một cột cao 0 ở cuối để dọn hết stack
    for (int i = 0; i < n; i++) cin >> h[i];

    stack<int> st;                    // chỉ số các cột có chiều cao tăng dần
    long long best = 0;
    for (int i = 0; i <= n; i++) {
        while (!st.empty() && h[st.top()] >= h[i]) {
            long long height = h[st.top()];
            st.pop();
            // Cột vừa lấy ra là cột thấp nhất của đoạn từ (đỉnh stack mới + 1) tới (i - 1).
            int left = st.empty() ? 0 : st.top() + 1;
            best = max(best, height * (i - left));
        }
        st.push(i);
    }
    cout << best << "\n";
    return 0;
}
