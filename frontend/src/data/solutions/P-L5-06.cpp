#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<int> p(n);
    int cnt[10] = {0};                 // số tài liệu còn trong hàng theo độ ưu tiên
    queue<int> q;
    for (int i = 0; i < n; i++) {
        cin >> p[i];
        cnt[p[i]]++;
        q.push(i);
    }

    int printed = 0;
    while (true) {
        int j = q.front();
        q.pop();
        bool higher = false;
        for (int v = p[j] + 1; v <= 9; v++) if (cnt[v] > 0) { higher = true; break; }
        if (higher) {
            q.push(j);                 // còn tài liệu quan trọng hơn: xuống cuối hàng
        } else {
            printed++;
            cnt[p[j]]--;
            if (j == m - 1) break;
        }
    }
    cout << printed << '\n';
    return 0;
}
