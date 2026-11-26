#include <algorithm>
#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    // take2 = best(i − 2), take1 = best(i − 1); best(i) = max(bỏ a[i], chọn a[i] + best(i − 2)).
    // Bắt đầu từ 0 (chọn rỗng) nên số âm không bao giờ bị ép phải chọn.
    long long take2 = 0, take1 = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        long long cur = max(take1, take2 + x);
        take2 = take1;
        take1 = cur;
    }
    cout << take1 << '\n';
    return 0;
}
