#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<string> grid(n);
    for (auto& row : grid) cin >> row;

    const int dx[4] = {1, -1, 0, 0};
    const int dy[4] = {0, 0, 1, -1};
    int islands = 0;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (grid[i][j] != '1') continue;
            islands++;
            queue<pair<int, int>> q;
            q.push({i, j});
            grid[i][j] = '0';                    // đánh dấu đã thăm ngay khi cho vào hàng đợi
            while (!q.empty()) {
                auto [x, y] = q.front();
                q.pop();
                for (int d = 0; d < 4; d++) {
                    int u = x + dx[d], v = y + dy[d];
                    if (u >= 0 && u < n && v >= 0 && v < m && grid[u][v] == '1') {
                        grid[u][v] = '0';
                        q.push({u, v});
                    }
                }
            }
        }
    }
    cout << islands << "\n";
    return 0;
}
