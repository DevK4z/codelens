#include <algorithm>
#include <iostream>
#include <numeric>
#include <tuple>
#include <vector>
using namespace std;

vector<int> parent, sz;

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];         // nén đường đi
        x = parent[x];
    }
    return x;
}

bool unite(int a, int b) {
    a = find(a), b = find(b);
    if (a == b) return false;                  // đã cùng tập: cạnh này tạo chu trình
    if (sz[a] < sz[b]) swap(a, b);
    parent[b] = a;
    sz[a] += sz[b];
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<tuple<long long, int, int>> edges(m);
    for (auto& [w, u, v] : edges) cin >> u >> v >> w;
    sort(edges.begin(), edges.end());          // theo chi phí tăng dần
    parent.resize(n + 1);
    iota(parent.begin(), parent.end(), 0);
    sz.assign(n + 1, 1);
    long long total = 0;
    int used = 0;
    for (const auto& [w, u, v] : edges)
        if (unite(u, v)) { total += w; used++; }
    cout << (used == n - 1 ? total : -1) << '\n';
    return 0;
}
