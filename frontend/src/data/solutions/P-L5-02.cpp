#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n, x1, y1, x2, y2;
    cin >> n >> x1 >> y1 >> x2 >> y2;

    const int dx[8] = {1, 2, 2, 1, -1, -2, -2, -1};
    const int dy[8] = {2, 1, -1, -2, -2, -1, 1, 2};
    vector<vector<int>> dist(n + 1, vector<int>(n + 1, -1));
    queue<pair<int, int>> q;
    dist[x1][y1] = 0;
    q.push({x1, y1});

    while (!q.empty()) {
        auto [x, y] = q.front();
        q.pop();
        if (x == x2 && y == y2) break;          // BFS: lần đầu tới đích là ngắn nhất
        for (int d = 0; d < 8; d++) {
            int u = x + dx[d], v = y + dy[d];
            if (u >= 1 && u <= n && v >= 1 && v <= n && dist[u][v] == -1) {
                dist[u][v] = dist[x][y] + 1;
                q.push({u, v});
            }
        }
    }
    cout << dist[x2][y2] << "\n";
    return 0;
}
