#include <iostream>
#include <vector>
using namespace std;

int search(const vector<long long>& a, long long x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[lo] <= a[mid]) {                     // nửa trái a[lo..mid] được sắp đúng
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                   // nửa phải a[mid..hi] được sắp đúng
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

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
        cout << search(a, x) << "\n";
    }
    return 0;
}
