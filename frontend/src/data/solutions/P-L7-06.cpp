#include <algorithm>
#include <climits>
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
    sort(a.begin(), a.end());

    long long best = LLONG_MAX;
    for (int i = 1; i < n; i++) best = min(best, a[i] - a[i - 1]);   // chỉ cần xét các cặp kề nhau
    cout << best << "\n";
    return 0;
}
