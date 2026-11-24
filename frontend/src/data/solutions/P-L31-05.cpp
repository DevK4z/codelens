#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<string> grid(n);
    for (auto& row : grid) cin >> row;
    const long long MOD = 1000000007;

    // ways[j] của hàng hiện tại = số đường tới ô (i, j); chỉ cần một hàng vì ô (i, j) chỉ nhận từ trên và từ trái.
    vector<long long> ways(m, 0);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (grid[i][j] == '#') { ways[j] = 0; continue; }
            if (i == 0 && j == 0) { ways[j] = 1; continue; }
            long long fromTop = ways[j];               // giá trị cũ của ways[j] là hàng i - 1
            long long fromLeft = j > 0 ? ways[j - 1] : 0;
            ways[j] = (fromTop + fromLeft) % MOD;
        }
    }
    cout << ways[m - 1] << "\n";
    return 0;
}
