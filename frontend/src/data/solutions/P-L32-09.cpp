#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> g(n), c(n);
    for (auto& x : g) cin >> x;
    for (auto& x : c) cin >> x;

    long long total = 0, tank = 0;
    int start = 0;
    for (int i = 0; i < n; i++) {
        total += g[i] - c[i];
        tank += g[i] - c[i];
        if (tank < 0) {          // không trạm nào trong [start, i] xuất phát được
            start = i + 1;
            tank = 0;
        }
    }
    cout << (total >= 0 ? start + 1 : -1) << '\n';
    return 0;
}
