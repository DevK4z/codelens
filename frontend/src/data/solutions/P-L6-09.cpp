#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> key(n + 1);
    vector<int> L(n + 1), R(n + 1);
    for (int i = 1; i <= n; i++) cin >> key[i] >> L[i] >> R[i];

    queue<int> q;
    q.push(1);
    for (int level = 0; !q.empty(); level++) {
        int size = q.size();               // số nút của mức hiện tại
        vector<long long> row;
        for (int i = 0; i < size; i++) {
            int v = q.front();
            q.pop();
            row.push_back(key[v]);
            if (L[v]) q.push(L[v]);
            if (R[v]) q.push(R[v]);
        }
        if (level % 2 == 1) reverse(row.begin(), row.end());
        for (size_t i = 0; i < row.size(); i++) cout << row[i] << (i + 1 < row.size() ? ' ' : '\n');
    }
    return 0;
}
