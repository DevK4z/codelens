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
    vector<pair<long long, long long>> seg(n);   // (l, r)
    for (auto& [l, r] : seg) cin >> l >> r;
    sort(seg.begin(), seg.end(), [](const auto& a, const auto& b) { return a.second < b.second; });

    int points = 0;
    long long last = 0;              // vị trí điểm vừa đóng
    for (const auto& [l, r] : seg) {
        if (points == 0 || l > last) {   // đoạn này chưa chứa điểm nào
            last = r;
            points++;
        }
    }
    cout << points << "\n";
    return 0;
}
