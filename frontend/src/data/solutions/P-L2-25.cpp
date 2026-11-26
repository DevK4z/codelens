#include <iostream>
using namespace std;

int n, g[15][15];
bool seen[15][15];
const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};

// Chỉ hỏi CÓ đường hay không, nên ô đã thăm không cần bỏ đánh dấu khi quay lui:
// nếu từ một ô không tới được đích thì đi lại vào nó lần nữa cũng vô ích. Mỗi ô thăm tối đa một lần.
bool dfs(int r, int c) {
    if (r == n - 1 && c == n - 1) return true;
    seen[r][c] = true;
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n || g[nr][nc] || seen[nr][nc]) continue;
        if (dfs(nr, nc)) return true;
    }
    return false;
}

int main() {
    cin >> n;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) cin >> g[i][j];
    bool ok = g[0][0] == 0 && g[n - 1][n - 1] == 0 && dfs(0, 0);
    cout << (ok ? "YES" : "NO") << '\n';
    return 0;
}
