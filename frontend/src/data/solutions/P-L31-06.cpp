#include <algorithm>
#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;

    long long take = 0;   // tổng lớn nhất của tiền tố, có chọn phần tử cuối
    long long skip = 0;   // tổng lớn nhất của tiền tố, không chọn phần tử cuối
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        long long newTake = skip + x;           // chọn x thì phần tử trước không được chọn
        long long newSkip = max(take, skip);    // bỏ x thì phần tử trước tùy ý
        take = newTake;
        skip = newSkip;
    }
    cout << max(take, skip) << "\n";
    return 0;
}
