#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    if (n < 2) { cout << 0 << "\n"; return 0; }

    vector<bool> composite(n + 1, false);
    for (long long i = 2; i * i <= n; i++) {
        if (composite[i]) continue;
        for (long long j = i * i; j <= n; j += i) composite[j] = true;  // bội nhỏ hơn i*i đã bị gạch trước đó
    }

    int count = 0;
    for (int i = 2; i <= n; i++) if (!composite[i]) count++;
    cout << count << "\n";
    return 0;
}
