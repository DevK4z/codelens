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
    priority_queue<long long> low;                                       // nửa nhỏ, đỉnh lớn nhất
    priority_queue<long long, vector<long long>, greater<long long>> high;  // nửa lớn, đỉnh nhỏ nhất
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        if (low.empty() || x <= low.top()) low.push(x);
        else high.push(x);
        // Cân bằng: low có bằng hoặc hơn high đúng một phần tử.
        if (low.size() > high.size() + 1) { high.push(low.top()); low.pop(); }
        else if (high.size() > low.size()) { low.push(high.top()); high.pop(); }
        cout << low.top() << (i + 1 < n ? ' ' : '\n');
    }
    return 0;
}
