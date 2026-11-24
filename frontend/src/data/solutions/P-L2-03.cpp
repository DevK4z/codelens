#include <iostream>
using namespace std;

long long power(long long a, long long b, long long m) {
    if (b == 0) return 1 % m;                  // 1 % m để đúng cả khi m = 1
    long long half = power(a, b / 2, m);
    long long result = half * half % m;
    if (b % 2 == 1) result = result * (a % m) % m;
    return result;
}

int main() {
    long long a, b, m;
    cin >> a >> b >> m;
    cout << power(a, b, m) << "\n";
    return 0;
}
