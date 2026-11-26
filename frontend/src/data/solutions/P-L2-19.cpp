#include <iostream>
using namespace std;

int n, perm[8];
bool used[8];

// Vị trí pos thử các số chưa dùng theo thứ tự tăng dần → hoán vị ra theo thứ tự từ điển.
void gen(int pos) {
    if (pos == n) {
        for (int i = 0; i < n; i++) cout << (i ? " " : "") << perm[i];
        cout << '\n';
        return;
    }
    for (int x = 1; x <= n; x++)
        if (!used[x]) {
            used[x] = true;
            perm[pos] = x;
            gen(pos + 1);
            used[x] = false;   // trả lại để nhánh khác dùng
        }
}

int main() {
    ios::sync_with_stdio(false);
    cin >> n;
    gen(0);
    return 0;
}
