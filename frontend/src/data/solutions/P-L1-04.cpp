#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;

    long long count = 0;
    for (long long d = 1; d * d <= n; d++) {
        if (n % d != 0) continue;
        count += (d * d == n) ? 1 : 2;   // d và n/d; nếu trùng nhau thì chỉ tính một
    }
    cout << count << "\n";
    return 0;
}
