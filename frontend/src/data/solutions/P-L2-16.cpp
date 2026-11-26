#include <iostream>
using namespace std;

long long memoX[31], memoY[31];

long long Y(int n);   // khai báo trước để X gọi được Y

long long X(int n) {
    if (n == 0) return 1;
    if (memoX[n]) return memoX[n];   // mọi giá trị đều dương nên 0 nghĩa là chưa tính
    return memoX[n] = X(n - 1) + Y(n - 1);
}

long long Y(int n) {
    if (n == 0) return 1;
    if (memoY[n]) return memoY[n];
    return memoY[n] = 2 * X(n - 1) + Y(n - 1);
}

int main() {
    int n;
    cin >> n;
    cout << X(n) << ' ' << Y(n) << '\n';
    return 0;
}
