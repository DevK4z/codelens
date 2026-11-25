#include <algorithm>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    // Khóa so sánh (khoảng cách², x, y); priority_queue mặc định là max-heap.
    priority_queue<tuple<long long, long long, long long>> heap;
    for (int i = 0; i < n; i++) {
        long long x, y;
        cin >> x >> y;
        heap.push({x * x + y * y, x, y});
        if ((int)heap.size() > k) heap.pop();      // bỏ điểm xa nhất trong k + 1 điểm
    }
    vector<tuple<long long, long long, long long>> best;
    while (!heap.empty()) { best.push_back(heap.top()); heap.pop(); }
    reverse(best.begin(), best.end());              // heap trả về từ xa đến gần
    for (auto& [d, x, y] : best) cout << x << ' ' << y << '\n';
    return 0;
}
