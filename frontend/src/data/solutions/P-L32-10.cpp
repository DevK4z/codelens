#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> r(n);
    for (auto& x : r) cin >> x;

    vector<long long> left(n, 1);                 // chỉ xét bạn bên trái
    for (int i = 1; i < n; i++)
        if (r[i] > r[i - 1]) left[i] = left[i - 1] + 1;

    long long total = left[n - 1], right = 1;    // right: chỉ xét bạn bên phải
    for (int i = n - 2; i >= 0; i--) {
        right = r[i] > r[i + 1] ? right + 1 : 1;
        total += max(left[i], right);
    }
    cout << total << '\n';
    return 0;
}
