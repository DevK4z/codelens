#include <iostream>
#include <stack>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> key(n + 1);
    vector<int> L(n + 1), R(n + 1);
    for (int i = 1; i <= n; i++) cin >> key[i] >> L[i] >> R[i];

    // Mỗi cặp (a, b) cần là ảnh gương của nhau. Dùng stack thay cho đệ quy (cây có thể sâu 10^5).
    stack<pair<int, int>> st;
    st.push({L[1], R[1]});
    bool ok = true;
    while (!st.empty() && ok) {
        auto [a, b] = st.top();
        st.pop();
        if (a == 0 && b == 0) continue;
        if (a == 0 || b == 0 || key[a] != key[b]) { ok = false; break; }
        st.push({L[a], R[b]});      // ngoài với ngoài
        st.push({R[a], L[b]});      // trong với trong
    }
    cout << (ok ? "YES" : "NO") << '\n';
    return 0;
}
