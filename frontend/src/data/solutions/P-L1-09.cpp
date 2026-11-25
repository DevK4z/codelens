#include <cmath>
#include <iostream>
using namespace std;

// Phần nguyên căn bậc hai chính xác cho x tới 10^18.
long long isqrt(long long x) {
    long long k = (long long)sqrtl((long double)x);
    // sqrtl có thể lệch 1 ở số lớn: chỉnh lại, dùng phép chia để so sánh mà không tràn.
    while (k > 0 && k > x / k) k--;                 // k * k > x
    while ((k + 1) <= x / (k + 1)) k++;             // (k + 1)^2 <= x
    return k;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        long long l, r;
        cin >> l >> r;
        cout << isqrt(r) - isqrt(l - 1) << '\n';
    }
    return 0;
}
