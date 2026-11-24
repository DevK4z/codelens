#include <iostream>
#include <vector>
using namespace std;

vector<long long> a, tmp;

// Sắp a[l, r) và trả về số cặp nghịch thế trong đoạn đó.
long long sortCount(int l, int r) {
    if (r - l <= 1) return 0;
    int mid = (l + r) / 2;
    long long count = sortCount(l, mid) + sortCount(mid, r);
    int i = l, j = mid, k = l;
    while (i < mid && j < r) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else { count += mid - i; tmp[k++] = a[j++]; }   // a[j] nhỏ hơn mọi a[i..mid)
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < r) tmp[k++] = a[j++];
    for (int x = l; x < r; x++) a[x] = tmp[x];
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
