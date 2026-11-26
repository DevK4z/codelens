#include <iostream>
using namespace std;

// a^n = (a^(n/2))², nhân thêm a nếu n lẻ. Chỉ một lời gọi đệ quy mỗi mức nên có O(log n) mức.
long long power(long long a, int n) {
    if (n == 0) return 1;
    long long half = power(a, n / 2);
    return n % 2 ? half * half * a : half * half;
}

int main() {
    long long a;
    int n;
    cin >> a >> n;
    cout << power(a, n) << '\n';
    return 0;
}
