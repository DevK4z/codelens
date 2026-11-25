#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    vector<int> prev(n + 1, 0), cur(n + 1, 0);   // f của hàng trước và hàng hiện tại (cột lệch 1)
    int best = 0;
    for (int i = 0; i < m; i++) {
        string row;
        cin >> row;
        for (int j = 1; j <= n; j++) {
            cur[j] = row[j - 1] == '1' ? 1 + min({prev[j], cur[j - 1], prev[j - 1]}) : 0;
            best = max(best, cur[j]);
        }
        swap(prev, cur);
    }
    cout << best << '\n';
    return 0;
}
