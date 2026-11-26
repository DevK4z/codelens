#include <iostream>
using namespace std;

// UCLN(a, b) = UCLN(b, a mod b); UCLN(a, 0) = a.
long long gcdRec(long long a, long long b) {
    if (b == 0) return a;
    return gcdRec(b, a % b);
}

int main() {
    long long a, b;
    cin >> a >> b;
    cout << gcdRec(a, b) << '\n';
    return 0;
}
