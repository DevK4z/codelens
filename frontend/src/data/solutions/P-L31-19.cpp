#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> p(n + 1);
    for (auto& x : p) cin >> x;
    // cost[i][j] = số phép nhân ít nhất để tính Ai × … × Aj (1 ≤ i ≤ j ≤ n).
    // Phép nhân cuối cùng tách ở k: (Ai..Ak) × (Ak+1..Aj), tốn thêm p[i−1]·p[k]·p[j].
    vector<vector<long long>> cost(n + 1, vector<long long>(n + 1, 0));
    for (int len = 2; len <= n; len++)            // đoạn ngắn trước để đoạn con đã có kết quả
        for (int i = 1; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            cost[i][j] = -1;
            for (int k = i; k < j; k++) {
                long long c = cost[i][k] + cost[k + 1][j] + p[i - 1] * p[k] * p[j];
                if (cost[i][j] < 0 || c < cost[i][j]) cost[i][j] = c;
            }
        }
    cout << cost[1][n] << '\n';
    return 0;
}
