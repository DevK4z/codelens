#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    priority_queue<long long, vector<long long>, greater<long long>> ropes;   // hàng đợi ưu tiên lấy nhỏ nhất
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        ropes.push(x);
    }

    long long cost = 0;
    while (ropes.size() > 1) {
        long long a = ropes.top(); ropes.pop();
        long long b = ropes.top(); ropes.pop();
        cost += a + b;
        ropes.push(a + b);          // sợi mới quay lại hàng đợi
    }
    cout << cost << "\n";
    return 0;
}
