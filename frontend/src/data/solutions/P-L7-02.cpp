#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    unordered_map<long long, int> freq;
    freq.reserve(n * 2);
    for (auto& x : a) { cin >> x; freq[x]++; }

    sort(a.begin(), a.end(), [&](long long x, long long y) {
        if (freq[x] != freq[y]) return freq[x] > freq[y];
        return x < y;
    });
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}
