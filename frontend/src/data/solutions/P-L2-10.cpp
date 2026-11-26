#include <iostream>
using namespace std;

// S(n) = n + S(n - 1), S(0) = 0. Độ sâu đệ quy n ≤ 1000 là an toàn.
long long sumTo(int n) {
    if (n == 0) return 0;
    return n + sumTo(n - 1);
}

int main() {
    int n;
    cin >> n;
    cout << sumTo(n) << '\n';
    return 0;
}
