#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    while (q--) {
        long long x;
        cin >> x;
        auto left = lower_bound(a.begin(), a.end(), x);   // phần tử đầu tiên >= x
        auto right = upper_bound(a.begin(), a.end(), x);  // phần tử đầu tiên >  x
        cout << (right - left) << "\n";
    }
    return 0;
}
