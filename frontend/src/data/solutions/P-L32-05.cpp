#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n), b(n);
    for (auto& x : a) cin >> x;
    for (auto& x : b) cin >> x;
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());

    long long total = 0;
    for (int i = 0; i < n; i++) total += llabs(a[i] - b[i]);   // người thấp thứ i ghép với người thấp thứ i
    cout << total << "\n";
    return 0;
}
