#include <iostream>
using namespace std;

long long gcd(long long a, long long b) {
    while (b != 0) {          // Euclid: gcd(a, b) = gcd(b, a % b)
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        long long a, b;
        cin >> a >> b;
        long long g = gcd(a, b);
        long long l = a / g * b;  // chia trước rồi nhân để không tràn
        cout << g << ' ' << l << '\n';
    }
    return 0;
}
