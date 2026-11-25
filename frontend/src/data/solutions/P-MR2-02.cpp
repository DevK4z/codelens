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
    bool ok = true;
    for (int i = 0; 2 * i + 1 < n && ok; i++) {          // chỉ nút trong mới có con
        if (a[2 * i + 1] > a[i]) ok = false;
        if (2 * i + 2 < n && a[2 * i + 2] > a[i]) ok = false;
    }
    cout << (ok ? "YES" : "NO") << '\n';
    return 0;
}
