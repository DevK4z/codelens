#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    deque<int> dq;   // chỉ số trong cửa sổ, giá trị giảm dần từ đầu tới cuối
    bool first = true;
    for (int i = 0; i < n; i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();       // chỉ số đã rời cửa sổ
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();     // không bao giờ còn là max
        dq.push_back(i);
        if (i >= k - 1) {
            cout << (first ? "" : " ") << a[dq.front()];
            first = false;
        }
    }
    cout << "\n";
    return 0;
}
