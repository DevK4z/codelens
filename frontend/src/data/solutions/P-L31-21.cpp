#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string X, Y;
    cin >> X >> Y;
    int n = X.size(), m = Y.size();
    // L[i][j] = độ dài dãy con chung dài nhất của X[i..] và Y[j..] (tính từ cuối lên).
    vector<vector<int>> L(n + 1, vector<int>(m + 1, 0));
    for (int i = n - 1; i >= 0; i--)
        for (int j = m - 1; j >= 0; j--)
            L[i][j] = X[i] == Y[j] ? L[i + 1][j + 1] + 1 : max(L[i + 1][j], L[i][j + 1]);
    if (L[0][0] == 0) { cout << 0 << '\n'; return 0; }

    // Z phải dài nhất (L[0][0] chữ số). Dựng từng chữ số từ trái sang: thử chữ số lớn nhất d trước;
    // lấy lần xuất hiện ĐẦU TIÊN của d trong X[i..] và Y[j..] (để chừa nhiều chỗ nhất cho phần sau),
    // nhận d nếu phần còn lại vẫn đủ dài.
    string Z;
    int i = 0, j = 0;
    for (int need = L[0][0]; need > 0; need--)
        for (char d = '9'; d >= '1'; d--) {
            int a = X.find(d, i), b = Y.find(d, j);
            if (a == (int)string::npos || b == (int)string::npos || L[a][b] < need) continue;
            Z += d;
            i = a + 1;
            j = b + 1;
            break;
        }
    cout << Z << '\n';
    return 0;
}
