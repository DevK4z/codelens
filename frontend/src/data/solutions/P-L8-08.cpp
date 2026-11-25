#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n), tmp(n);
    for (auto& x : a) cin >> x;

    for (int width = 1; width < n; width *= 2) {
        for (int lo = 0; lo < n; lo += 2 * width) {
            int mid = min(lo + width, n), hi = min(lo + 2 * width, n);
            int i = lo, j = mid, k = lo;
            while (i < mid && j < hi) tmp[k++] = (a[j] < a[i]) ? a[j++] : a[i++];   // ổn định: bằng nhau lấy bên trái
            while (i < mid) tmp[k++] = a[i++];
            while (j < hi) tmp[k++] = a[j++];
        }
        swap(a, tmp);
        for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\n');
    }
    return 0;
}
