#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    // diff[i] ghi lượng thay đổi bắt đầu từ vị trí i; cộng dồn diff sẽ ra phần cộng thêm của từng ô.
    vector<long long> diff(n + 2, 0);
    while (q--) {
        int l, r;
        long long v;
        cin >> l >> r >> v;
        diff[l] += v;       // từ l trở đi được cộng v
        diff[r + 1] -= v;   // từ r + 1 trở đi hủy lượng cộng đó
    }

    long long add = 0;
    for (int i = 1; i <= n; i++) {
        add += diff[i];
        cout << a[i] + add << (i < n ? " " : "\n");
    }
    return 0;
}
