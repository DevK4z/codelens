#include <iostream>
using namespace std;

int n, target, a[20];
bool found = false;

// Thử đưa từng phần tử vào nhóm thứ nhất hay không; nhóm thứ hai là phần còn lại.
void dfs(int i, int sum) {
    if (found || sum > target) return;   // đã tìm thấy, hoặc vượt nửa tổng: dừng nhánh
    if (i == n) { found = (sum == target); return; }
    dfs(i + 1, sum + a[i]);
    dfs(i + 1, sum);
}

int main() {
    cin >> n;
    int total = 0;
    for (int i = 0; i < n; i++) { cin >> a[i]; total += a[i]; }
    if (total % 2 == 0) {                // tổng lẻ thì chắc chắn không chia được
        target = total / 2;
        dfs(0, 0);
    }
    cout << (found ? "YES" : "NO") << '\n';
    return 0;
}
