#include <iostream>
using namespace std;

int n;
long long ways = 0;
bool col[12], diag1[23], diag2[23];   // diag1: r + c, diag2: r − c + n − 1

// Đặt hậu cho hàng r; mỗi hàng đúng một quân nên chỉ cần kiểm tra cột và hai đường chéo, O(1).
void place(int r) {
    if (r == n) { ways++; return; }
    for (int c = 0; c < n; c++) {
        if (col[c] || diag1[r + c] || diag2[r - c + n - 1]) continue;
        col[c] = diag1[r + c] = diag2[r - c + n - 1] = true;
        place(r + 1);
        col[c] = diag1[r + c] = diag2[r - c + n - 1] = false;
    }
}

int main() {
    cin >> n;
    place(0);
    cout << ways << '\n';
    return 0;
}
