#include <iostream>
using namespace std;

int n;
bool seen[5][5];
const int dx[] = {2, 1, -1, -2, -2, -1, 1, 2}, dy[] = {1, 2, 2, 1, -1, -2, -2, -1};

bool inside(int x, int y) { return x >= 0 && y >= 0 && x < n && y < n; }

// Đã thăm k ô, đang đứng ở (x, y). Thử 8 nước đi, quay lui (bỏ đánh dấu) khi nhánh thất bại.
bool tour(int x, int y, int k) {
    if (k == n * n) return true;
    for (int d = 0; d < 8; d++) {
        int a = x + dx[d], b = y + dy[d];
        if (!inside(a, b) || seen[a][b]) continue;
        seen[a][b] = true;
        if (tour(a, b, k + 1)) return true;
        seen[a][b] = false;
    }
    return false;
}

int main() {
    int r, c;
    cin >> n >> r >> c;
    // Mã luôn đổi màu ô sau mỗi nước. Khi n lẻ, màu của ô (1,1) có nhiều hơn màu kia một ô,
    // nên hành trình phải bắt đầu (và kết thúc) ở màu đó: (r + c) chẵn. Loại ngay các ô còn lại.
    bool possible = !(n % 2 == 1 && (r + c) % 2 == 1);
    seen[r - 1][c - 1] = true;
    cout << (possible && tour(r - 1, c - 1, 1) ? "YES" : "NO") << '\n';
    return 0;
}
