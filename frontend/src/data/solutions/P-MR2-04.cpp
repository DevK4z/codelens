#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<long long, long long>> meet(n);
    for (auto& [s, e] : meet) cin >> s >> e;
    sort(meet.begin(), meet.end());                       // theo giờ bắt đầu

    priority_queue<long long, vector<long long>, greater<long long>> ends;   // giờ kết thúc các phòng
    for (const auto& [s, e] : meet) {
        if (!ends.empty() && ends.top() <= s) ends.pop(); // phòng trống sớm nhất dùng lại được
        ends.push(e);
    }
    cout << ends.size() << '\n';
    return 0;
}
