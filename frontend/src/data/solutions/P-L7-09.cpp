#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<long long, long long>> seg(n);
    for (auto& [l, r] : seg) cin >> l >> r;
    sort(seg.begin(), seg.end());                  // theo đầu trái

    vector<pair<long long, long long>> merged;
    for (const auto& [l, r] : seg) {
        if (!merged.empty() && l <= merged.back().second)
            merged.back().second = max(merged.back().second, r);   // có điểm chung: nới đoạn cuối
        else
            merged.push_back({l, r});
    }
    cout << merged.size() << '\n';
    for (const auto& [l, r] : merged) cout << l << ' ' << r << '\n';
    return 0;
}
