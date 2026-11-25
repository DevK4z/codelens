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
    vector<int> color(n + 1, -1);
    bool ok = true;
    for (int s = 1; s <= n && ok; s++) {
        if (color[s] != -1) continue;        // mỗi thành phần tô riêng
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty() && ok) {
            int u = q.front();
            q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) { ok = false; break; }   // chu trình lẻ
            }
        }
    }
    cout << (ok ? "YES" : "NO") << '\n';
    return 0;
}
