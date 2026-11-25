#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<bool> visited(n + 1, false);
    int components = 0;
    for (int s = 1; s <= n; s++) {
        if (visited[s]) continue;
        components++;                       // s mở ra một thành phần mới
        queue<int> q;
        q.push(s);
        visited[s] = true;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u])
                if (!visited[v]) { visited[v] = true; q.push(v); }
        }
    }
    cout << components << '\n';
    return 0;
}
