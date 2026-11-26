#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, S;
    cin >> n >> S;
    // can[t] = có tập con (trong các phần tử đã xét) tổng đúng t. Tập rỗng cho can[0] = true.
    vector<char> can(S + 1, 0);
    can[0] = 1;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        // Duyệt t giảm dần để mỗi phần tử chỉ được dùng một lần.
        for (int t = S; t >= x; t--)
            if (can[t - x]) can[t] = 1;
    }
    cout << (can[S] ? "YES" : "NO") << '\n';
    return 0;
}
