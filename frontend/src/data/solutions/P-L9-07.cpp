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
    int lo = 0, hi = n - 1;                 // đỉnh luôn nằm trong [lo, hi]
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;   // sườn lên: đỉnh ở bên phải
        else hi = mid;                           // sườn xuống hoặc đỉnh
    }
    cout << lo + 1 << '\n';
    return 0;
}
