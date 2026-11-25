#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<long long> res(n + m, 0);              // res[k]: hàng 10^k, chưa xử lý nhớ
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            res[i + j] += (a[n - 1 - i] - '0') * (b[m - 1 - j] - '0');
    for (int k = 0; k + 1 < n + m; k++) {         // đẩy phần nhớ lên hàng trên
        res[k + 1] += res[k] / 10;
        res[k] %= 10;
    }
    int top = n + m - 1;
    while (top > 0 && res[top] == 0) top--;       // bỏ số 0 thừa, giữ ít nhất một chữ số
    for (int k = top; k >= 0; k--) cout << res[k];
    cout << '\n';
    return 0;
}
