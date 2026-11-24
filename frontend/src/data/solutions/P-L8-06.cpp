#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<long long> a, tmp;

long long sortCount(int l, int r) {   // đoạn [l, r)
    if (r - l <= 1) return 0;
    int mid = (l + r) / 2;
    long long count = sortCount(l, mid) + sortCount(mid, r);

    // Hai nửa đã sắp: với mỗi i bên trái, các j bên phải thỏa a[i] > 2·a[j] là một tiền tố, và tiền tố đó chỉ dài ra.
    int j = mid;
    for (int i = l; i < mid; i++) {
        while (j < r && a[i] > 2 * a[j]) j++;
        count += j - mid;
    }

    merge(a.begin() + l, a.begin() + mid, a.begin() + mid, a.begin() + r, tmp.begin() + l);
    copy(tmp.begin() + l, tmp.begin() + r, a.begin() + l);
    return count;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    a.resize(n);
    tmp.resize(n);
    for (auto& x : a) cin >> x;
    cout << sortCount(0, n) << "\n";
    return 0;
}
