#include <iostream>
#include <string>
using namespace std;

int n;
string cur;

// Điền vị trí i: thử '0' trước rồi '1', nên các dãy tự ra đúng thứ tự từ điển.
void gen(int i) {
    if (i == n) { cout << cur << '\n'; return; }
    for (char c : {'0', '1'}) {
        cur[i] = c;
        gen(i + 1);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin >> n;
    cur.assign(n, '0');
    gen(0);
    return 0;
}
