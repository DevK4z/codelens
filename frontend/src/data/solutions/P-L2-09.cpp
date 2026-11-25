#include <iostream>
#include <string>
#include <vector>
using namespace std;

int board[81];
int rowMask[9], colMask[9], boxMask[9];   // bit d bật: chữ số d đã có

int boxOf(int r, int c) { return r / 3 * 3 + c / 3; }

void place(int i, int d, bool on) {
    int r = i / 9, c = i % 9, bit = 1 << d;
    rowMask[r] ^= bit; colMask[c] ^= bit; boxMask[boxOf(r, c)] ^= bit;
    board[i] = on ? d : 0;
}

bool solve() {
    // Chọn ô trống có ít ứng viên nhất để cắt nhánh sớm.
    int best = -1, bestMask = 0, bestCount = 10;
    for (int i = 0; i < 81; i++) {
        if (board[i]) continue;
        int r = i / 9, c = i % 9;
        int mask = ~(rowMask[r] | colMask[c] | boxMask[boxOf(r, c)]) & 0x3FE;  // bit 1..9
        int cnt = __builtin_popcount(mask);
        if (cnt < bestCount) { best = i; bestMask = mask; bestCount = cnt; }
        if (cnt == 0) return false;                 // ô này không còn chữ số nào
    }
    if (best == -1) return true;                    // đã điền hết
    for (int d = 1; d <= 9; d++) {
        if (!(bestMask >> d & 1)) continue;
        place(best, d, true);
        if (solve()) return true;
        place(best, d, false);
    }
    return false;
}

int main() {
    for (int r = 0; r < 9; r++) {
        string line;
        cin >> line;
        for (int c = 0; c < 9; c++)
            if (line[c] != '.') place(r * 9 + c, line[c] - '0', true);
    }
    solve();
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) cout << board[r * 9 + c];
        cout << '\n';
    }
    return 0;
}
