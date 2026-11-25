#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    vector<int> order(n);                     // order[k] = chỉ số gốc của phần tử nhỏ thứ k
    for (int i = 0; i < n; i++) order[i] = i;
    sort(order.begin(), order.end(), [&](int x, int y) { return a[x] < a[y]; });

    vector<bool> visited(n, false);
    int cycles = 0;
    for (int i = 0; i < n; i++) {
        if (visited[i]) continue;
        cycles++;
        for (int j = i; !visited[j]; j = order[j]) visited[j] = true;   // đi hết một chu trình
    }
    cout << n - cycles << '\n';
    return 0;
}
