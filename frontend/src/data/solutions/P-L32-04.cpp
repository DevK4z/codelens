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
    vector<pair<long long, long long>> jobs(n);   // (thời gian t, hạn chót d)
    for (auto& [t, d] : jobs) cin >> t >> d;
    sort(jobs.begin(), jobs.end(), [](const auto& a, const auto& b) { return a.second < b.second; });

    long long finish = 0, worst = 0;
    for (const auto& [t, d] : jobs) {
        finish += t;
        worst = max(worst, finish - d);   // độ trễ = max(0, f - d); worst bắt đầu từ 0
    }
    cout << worst << "\n";
    return 0;
}
