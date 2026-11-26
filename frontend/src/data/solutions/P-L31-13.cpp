#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Chỉ cần hai giá trị gần nhất của bảng phương án: prev = F(i − 1), cur = F(i).
    long long prev = 1, cur = 1;
    for (int i = 3; i <= n; i++) {
        long long next = prev + cur;
        prev = cur;
        cur = next;
    }
    cout << cur << '\n';   // n = 1 hoặc 2: vòng lặp không chạy, cur = 1
    return 0;
}
