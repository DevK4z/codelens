#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    // Sau lời gọi, a[k-1] là phần tử đứng thứ k nếu sắp giảm dần.
    nth_element(a.begin(), a.begin() + (k - 1), a.end(), greater<long long>());
    cout << a[k - 1] << "\n";
    return 0;
}
