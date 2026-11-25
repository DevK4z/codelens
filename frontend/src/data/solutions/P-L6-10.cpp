#include <algorithm>
#include <climits>
#include <iostream>
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

    // Thứ tự BFS; duyệt ngược lại thì mọi con được xử lý trước cha (như hậu tự, không cần đệ quy).
    vector<int> order = {1};
    for (size_t i = 0; i < order.size(); i++) {
        int v = order[i];
        if (L[v]) order.push_back(L[v]);
        if (R[v]) order.push_back(R[v]);
    }
    vector<long long> down(n + 1, 0);     // tổng lớn nhất của đường đi xuống bắt đầu tại v
    long long best = LLONG_MIN;
    for (int i = (int)order.size() - 1; i >= 0; i--) {
        int v = order[i];
        long long left = L[v] ? max(0LL, down[L[v]]) : 0;
        long long right = R[v] ? max(0LL, down[R[v]]) : 0;
        best = max(best, key[v] + left + right);   // đường đi gấp khúc tại v
        down[v] = key[v] + max(left, right);
    }
    cout << best << '\n';
    return 0;
}
