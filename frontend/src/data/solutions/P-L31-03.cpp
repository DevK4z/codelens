#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int n = a.size(), m = b.size();

    vector<int> prev(m + 1), cur(m + 1);
    for (int j = 0; j <= m; j++) prev[j] = j;        // biến xâu rỗng thành B[0..j): chèn j ký tự
    for (int i = 1; i <= n; i++) {
        cur[0] = i;                                   // xóa i ký tự
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1];
            else cur[j] = 1 + min({prev[j], cur[j - 1], prev[j - 1]});  // xóa, chèn, thay
        }
        swap(prev, cur);
    }
    cout << prev[m] << "\n";
    return 0;
}
