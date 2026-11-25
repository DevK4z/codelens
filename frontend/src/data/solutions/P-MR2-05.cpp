#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

using Item = pair<int, string>;   // (tần suất, từ)

// Trả về true nếu a TỐT HƠN b: nhiều lần hơn, hoặc bằng nhau mà nhỏ hơn theo từ điển.
bool better(const Item& a, const Item& b) {
    return a.first != b.first ? a.first > b.first : a.second < b.second;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    unordered_map<string, int> freq;
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        freq[w]++;
    }
    // Comparator "better" khiến đỉnh heap là phần tử kém nhất.
    priority_queue<Item, vector<Item>, bool (*)(const Item&, const Item&)> heap(better);
    for (const auto& [w, f] : freq) {
        heap.push({f, w});
        if ((int)heap.size() > k) heap.pop();      // bỏ phần tử kém nhất
    }
    vector<Item> top;
    while (!heap.empty()) { top.push_back(heap.top()); heap.pop(); }
    reverse(top.begin(), top.end());
    for (const auto& [f, w] : top) cout << w << ' ' << f << '\n';
    return 0;
}
