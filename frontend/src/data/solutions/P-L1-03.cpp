#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long S;
    cin >> n >> S;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    long long sum = 0;   // tổng cửa sổ a[l..r]
    int best = 0, l = 0;
    for (int r = 0; r < n; r++) {
        sum += a[r];
        while (sum > S) sum -= a[l++];   // thu hẹp từ trái cho tới khi hợp lệ
        best = max(best, r - l + 1);
    }
    cout << best << "\n";
    return 0;
}
