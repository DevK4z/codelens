#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> t(n);
    for (auto& x : t) cin >> x;
    sort(t.begin(), t.end());        // người phục vụ nhanh đi trước

    long long totalWait = 0, elapsed = 0;
    for (long long x : t) {
        totalWait += elapsed;        // người này chờ hết thời gian của những người trước
        elapsed += x;
    }
    cout << totalWait << "\n";
    return 0;
}
