#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, M;
    cin >> n >> M;
    vector<int> w(n + 1);
    vector<long long> v(n + 1);
    for (int i = 1; i <= n; i++) cin >> w[i] >> v[i];
    // f[i][j] = giá trị lớn nhất khi chỉ dùng vật 1..i và khối lượng không vượt j.
    // Cần giữ đủ bảng để truy vết ngược.
    vector<vector<long long>> f(n + 1, vector<long long>(M + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 0; j <= M; j++) {
            f[i][j] = f[i - 1][j];
            if (j >= w[i]) f[i][j] = max(f[i][j], f[i - 1][j - w[i]] + v[i]);
        }
    // Truy vết từ vật n về 1: chỉ chọn vật i khi bỏ nó thì giá trị giảm (f[i][j] != f[i-1][j]).
    vector<int> chosen;
    int j = M;
    for (int i = n; i >= 1; i--)
        if (f[i][j] != f[i - 1][j]) {
            chosen.push_back(i);
            j -= w[i];
        }
    reverse(chosen.begin(), chosen.end());
    cout << f[n][M] << '\n' << chosen.size() << '\n';
    for (size_t k = 0; k < chosen.size(); k++) cout << (k ? " " : "") << chosen[k];
    cout << '\n';
    return 0;
}
