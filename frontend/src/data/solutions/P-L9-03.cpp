#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    unordered_map<long long, int> freq;
    freq.reserve(n * 2);
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        freq[x]++;
    }

    long long best = 0;
    int bestCount = 0;
    for (const auto& [value, count] : freq) {
        if (count > bestCount || (count == bestCount && value < best)) {
            best = value;
            bestCount = count;
        }
    }
    cout << best << " " << bestCount << "\n";
    return 0;
}
