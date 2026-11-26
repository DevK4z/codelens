#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // ways(i) = ways(i − 1) + ways(i − 2): bước cuối dài 1 hoặc 2. ways(0) = ways(1) = 1.
    long long before = 1, here = 1;   // ways(i − 1), ways(i) với i = 1
    for (int i = 2; i <= n; i++) {
        long long next = before + here;
        before = here;
        here = next;
    }
    cout << here << '\n';
    return 0;
}
