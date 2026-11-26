#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, M;
    cin >> n >> M;
    // dp[j] = giá trị lớn nhất với tổng khối lượng không vượt j, chỉ dùng các vật đã xét.
    vector<long long> dp(M + 1, 0);
    for (int i = 0; i < n; i++) {
        int w;
        long long v;
        cin >> w >> v;
        // Duyệt j giảm dần để mỗi vật chỉ được dùng một lần (dp[j - w] vẫn là giá trị của hàng trước).
        for (int j = M; j >= w; j--) dp[j] = max(dp[j], dp[j - w] + v);
    }
    cout << dp[M] << '\n';
    return 0;
}
