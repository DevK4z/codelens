#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;

    long long lo = 0, hi = 1000000000;   // đáp án luôn nằm trong [lo, hi]
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;   // làm tròn lên để vòng lặp luôn thu hẹp
        if (mid <= n / mid) lo = mid;              // mid*mid <= n, viết dạng chia để tránh tràn
        else hi = mid - 1;
    }
    cout << lo << "\n";
    return 0;
}
