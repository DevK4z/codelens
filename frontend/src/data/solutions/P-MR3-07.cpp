#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

vector<vector<pair<int, int>>> adj;   // (đỉnh kề, chỉ số cạnh)
vector<int> tin, low;
int timer = 0, bridges = 0;

void dfs(int u, int parentEdge) {
    tin[u] = low[u] = ++timer;
    for (auto [v, id] : adj[u]) {
        if (id == parentEdge) continue;              // không đi ngược lại đúng cạnh vừa tới
        if (tin[v]) {
            low[u] = min(low[u], tin[v]);            // cạnh ngược
        } else {
            dfs(v, id);
            low[u] = min(low[u], low[v]);
            if (low[v] > tin[u]) bridges++;          // cây con của v không vòng về được
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    adj.resize(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back({v, i});
        adj[v].push_back({u, i});
    }
    tin.assign(n + 1, 0);
    low.assign(n + 1, 0);
    for (int s = 1; s <= n; s++)
        if (!tin[s]) dfs(s, -1);
    cout << bridges << '\n';
    return 0;
}
