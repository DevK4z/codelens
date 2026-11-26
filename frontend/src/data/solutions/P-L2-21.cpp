#include <iostream>
using namespace std;

int n, m, a[20];
long long ways = 0;

// Xét phần tử i với tổng hiện tại sum: bỏ nó hoặc chọn nó.
void dfs(int i, int sum) {
    if (sum > m) return;                 // mọi a[i] dương nên tổng chỉ tăng: cắt nhánh
    if (i == n) { if (sum == m) ways++; return; }
    dfs(i + 1, sum);
    dfs(i + 1, sum + a[i]);
}

int main() {
    cin >> n >> m;
    for (int i = 0; i < n; i++) cin >> a[i];
    dfs(0, 0);                           // M ≥ 1 nên tập rỗng không bao giờ được đếm
    cout << ways << '\n';
    return 0;
}
