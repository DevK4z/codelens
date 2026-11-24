#include <algorithm>
#include <climits>
#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;

    long long best = LLONG_MIN;  // đoạn con phải khác rỗng nên không khởi tạo bằng 0
    long long cur = 0;           // tổng lớn nhất của đoạn kết thúc tại phần tử đang xét
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        cur = max(x, cur + x);
        best = max(best, cur);
    }
    cout << best << "\n";
    return 0;
}
