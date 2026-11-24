#include <iostream>
#include <string>
using namespace std;

int n;
string cur;

void generate(int pos) {
    if (pos == n) { cout << cur << "\n"; return; }
    cur.push_back('0');
    generate(pos + 1);
    cur.pop_back();
    if (pos == 0 || cur[pos - 1] == '0') {   // không đặt hai số 1 liền nhau
        cur.push_back('1');
        generate(pos + 1);
        cur.pop_back();
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    generate(0);
    return 0;
}
