#include <iostream>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    long long pivot = a[n - 1];
    int i = -1;                              // a[0..i] là các phần tử <= pivot
    for (int j = 0; j < n - 1; j++) {
        if (a[j] <= pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }
    swap(a[i + 1], a[n - 1]);                // pivot về đúng chỗ

    for (int k = 0; k < n; k++) cout << a[k] << (k + 1 < n ? " " : "\n");
    cout << i + 1 << "\n";
    return 0;
}
