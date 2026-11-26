#include <iostream>
using namespace std;

// n! = n · (n − 1)!, 0! = 1! = 1. 20! ≈ 2.4·10^18 vẫn vừa long long.
long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int n;
    cin >> n;
    cout << factorial(n) << '\n';
    return 0;
}
