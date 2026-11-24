#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    const long long MOD = 1000000007;

    // f3 = f(i-3), f2 = f(i-2), f1 = f(i-1); f(0) = 1, f(âm) = 0.
    long long f3 = 0, f2 = 0, f1 = 1;
    for (int i = 1; i <= n; i++) {
        long long cur = (f1 + f2 + f3) % MOD;
        f3 = f2;
        f2 = f1;
        f1 = cur;
    }
    cout << f1 << "\n";
    return 0;
}
