#include <algorithm>
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

    sort(a.begin(), a.end(), [](long long x, long long y) {
        bool evenX = x % 2 == 0, evenY = y % 2 == 0;
        if (evenX != evenY) return evenX;      // chẵn trước lẻ
        return evenX ? x < y : x > y;          // chẵn tăng dần, lẻ giảm dần
    });
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}
