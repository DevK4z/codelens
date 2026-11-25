#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    long long jumps = 0, curEnd = 0, farthest = 0;   // curEnd: xa nhất với `jumps` bước
    for (int i = 0; i < n - 1; i++) {
        if (i > curEnd) break;                       // không tới được ô i
        farthest = max(farthest, i + a[i]);
        if (i == curEnd) {                           // hết tầng hiện tại: phải nhảy thêm
            if (farthest <= curEnd) break;           // không tiến thêm được
            jumps++;
            curEnd = farthest;
        }
    }
    cout << (curEnd >= n - 1 ? jumps : -1) << '\n';
    return 0;
}
