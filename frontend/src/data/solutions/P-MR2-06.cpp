#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

struct Proc { long long arrive, dur, prio; int id; };

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<Proc> ps(n);
    for (int i = 0; i < n; i++) { cin >> ps[i].arrive >> ps[i].dur >> ps[i].prio; ps[i].id = i + 1; }
    sort(ps.begin(), ps.end(), [](const Proc& a, const Proc& b) { return a.arrive < b.arrive; });

    // Min-heap theo (ưu tiên, lúc đến, chỉ số); phần tử cuối là vị trí trong ps.
    using Key = tuple<long long, long long, int, int>;
    priority_queue<Key, vector<Key>, greater<Key>> ready;
    long long time = 0, totalWait = 0;
    size_t next = 0;                                     // tiến trình chưa đến kế tiếp
    vector<int> order;
    while (order.size() < ps.size()) {
        while (next < ps.size() && ps[next].arrive <= time) {
            ready.push({ps[next].prio, ps[next].arrive, ps[next].id, (int)next});
            next++;
        }
        if (ready.empty()) { time = ps[next].arrive; continue; }   // CPU chờ
        auto [prio, arrive, id, idx] = ready.top();
        ready.pop();
        totalWait += time - arrive;
        time += ps[idx].dur;
        order.push_back(id);
    }
    for (size_t i = 0; i < order.size(); i++) cout << order[i] << (i + 1 < order.size() ? ' ' : '\n');
    cout << totalWait << '\n';
    return 0;
}
