#include <iostream>
#include <vector>
using namespace std;

vector<long long> mergeTwo(const vector<long long>& a, const vector<long long>& b) {
    vector<long long> out;
    out.reserve(a.size() + b.size());
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}

// Trộn các dãy lists[lo..hi].
vector<long long> mergeRange(const vector<vector<long long>>& lists, int lo, int hi) {
    if (lo == hi) return lists[lo];
    int mid = (lo + hi) / 2;
    return mergeTwo(mergeRange(lists, lo, mid), mergeRange(lists, mid + 1, hi));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k;
    cin >> k;
    vector<vector<long long>> lists(k);
    for (auto& list : lists) {
        int m;
        cin >> m;
        list.resize(m);
        for (auto& x : list) cin >> x;
    }
    vector<long long> all = mergeRange(lists, 0, k - 1);
    for (size_t i = 0; i < all.size(); i++) cout << all[i] << (i + 1 < all.size() ? " " : "\n");
    return 0;
}
