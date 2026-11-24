#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long K;
    cin >> n >> K;

    unordered_map<long long, long long> seen;   // giá trị -> số lần đã gặp bên trái
    seen.reserve(n * 2);
    long long pairs = 0;
    for (int j = 0; j < n; j++) {
        long long x;
        cin >> x;
        auto it = seen.find(K - x);
        if (it != seen.end()) pairs += it->second;
        seen[x]++;
    }
    cout << pairs << "\n";
    return 0;
}
