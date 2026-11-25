#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<long long>> a(n);
    for (int i = 0; i < n; i++) {
        a[i].resize(i + 1);
        for (auto& x : a[i]) cin >> x;
    }
    vector<long long> best = a[n - 1];         // tổng lớn nhất từ hàng cuối xuống đáy
    for (int i = n - 2; i >= 0; i--)
        for (int j = 0; j <= i; j++)
            best[j] = a[i][j] + max(best[j], best[j + 1]);
    cout << best[0] << '\n';
    return 0;
}
