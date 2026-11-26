#include <iostream>
using namespace std;

long long memo[91];
bool known[91];

// Mỗi F(i) chỉ được tính một lần, các lần gọi sau lấy từ memo.
long long fib(int n) {
    if (n < 2) return n;
    if (known[n]) return memo[n];
    known[n] = true;
    return memo[n] = fib(n - 1) + fib(n - 2);
}

int main() {
    int n;
    cin >> n;
    cout << fib(n) << '\n';
    return 0;
}
