#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    vector<vector<long long>> a(m, vector<long long>(n));
    for (auto& row : a)
        for (auto& x : row) cin >> x;

    int top = 0, bottom = m - 1, left = 0, right = n - 1;
    bool first = true;
    auto print = [&](long long x) {
        if (!first) cout << ' ';
        cout << x;
        first = false;
    };
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) print(a[top][j]);
        for (int i = top + 1; i <= bottom; i++) print(a[i][right]);
        if (top < bottom)                      // còn hàng dưới khác hàng trên
            for (int j = right - 1; j >= left; j--) print(a[bottom][j]);
        if (left < right)                      // còn cột trái khác cột phải
            for (int i = bottom - 1; i > top; i--) print(a[i][left]);
        top++, bottom--, left++, right--;
    }
    cout << '\n';
    return 0;
}
