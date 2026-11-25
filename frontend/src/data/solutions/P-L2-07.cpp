#include <iostream>
#include <string>
using namespace std;

const string KEYS[10] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
string digits, cur;

void backtrack(size_t i) {
    if (i == digits.size()) {        // đã chọn đủ chữ cho mọi phím
        cout << cur << '\n';
        return;
    }
    for (char c : KEYS[digits[i] - '0']) {
        cur[i] = c;
        backtrack(i + 1);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> digits;
    cur.assign(digits.size(), ' ');
    backtrack(0);
    return 0;
}
