#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, q;
    cin >> n >> m >> q;

    // P[i][j] = tổng hình chữ nhật từ (1, 1) tới (i, j); thêm hàng/cột 0 để khỏi xét biên.
    vector<vector<long long>> P(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) {
            long long x;
            cin >> x;
            P[i][j] = x + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1];
        }

    while (q--) {
        int x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        // Bao hàm – loại trừ: bỏ dải phía trên và dải bên trái, cộng lại góc bị trừ hai lần.
        cout << P[x2][y2] - P[x1 - 1][y2] - P[x2][y1 - 1] + P[x1 - 1][y1 - 1] << "\n";
    }
    return 0;
}
