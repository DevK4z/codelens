#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int m = b.size();
    // prev[j] = LCS(a[0..i), b[0..j)), cur là hàng i + 1. Hàng mới chỉ cần hàng trước nên giữ hai hàng.
    vector<int> prev(m + 1, 0), cur(m + 1, 0);
    for (char x : a) {
        for (int j = 1; j <= m; j++)
            cur[j] = (x == b[j - 1]) ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    cout << prev[m] << '\n';
    return 0;
}
