#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, S;
    cin >> n >> S;
    vector<int> coins(n);
    for (auto& c : coins) cin >> c;

    const int INF = 1e9;
    vector<int> dp(S + 1, INF);   // dp[x]: số đồng ít nhất để đổi đúng x
    dp[0] = 0;
    for (int x = 1; x <= S; x++)
        for (int c : coins)
            if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;

    cout << (dp[S] >= INF ? -1 : dp[S]) << "\n";
    return 0;
}
