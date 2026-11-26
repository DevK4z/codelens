#include <iostream>
using namespace std;

int n, k, pick[13];

// Chọn phần tử thứ pos (0-based) trong khoảng [start, n − (k − pos) + 1]:
// cận trên chừa đủ chỗ cho các phần tử còn lại, nên không có nhánh nào đi vào ngõ cụt.
void gen(int pos, int start) {
    if (pos == k) {
        for (int i = 0; i < k; i++) cout << (i ? " " : "") << pick[i];
        cout << '\n';
        return;
    }
    for (int x = start; x <= n - (k - pos) + 1; x++) {
        pick[pos] = x;
        gen(pos + 1, x + 1);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin >> n >> k;
    gen(0, 1);
    return 0;
}
