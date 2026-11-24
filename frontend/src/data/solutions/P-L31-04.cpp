#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> price(n + 1);
    for (int i = 1; i <= n; i++) cin >> price[i];

    // best[len]: tiền lớn nhất khi bán một thanh dài len. Đoạn đầu tiên dài k, phần còn lại tối ưu.
    vector<long long> best(n + 1, 0);
    for (int len = 1; len <= n; len++)
        for (int k = 1; k <= len; k++)
            best[len] = max(best[len], price[k] + best[len - k]);

    cout << best[n] << "\n";
    return 0;
}
