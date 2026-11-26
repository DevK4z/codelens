#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<pair<long long, long long>> g(n);
    for (auto& [x, y] : g) cin >> x >> y;
    // Sắp theo x rồi theo y: mọi hành trình hợp lệ là một dãy con theo thứ tự này có y không giảm
    // (cùng x thì y tăng dần đứng trước, nên đi được). Bài toán thành dãy con KHÔNG GIẢM dài nhất của y.
    sort(g.begin(), g.end());
    vector<long long> tails;   // tails[L − 1] = y cuối nhỏ nhất của dãy không giảm độ dài L
    for (auto& pt : g) {
        // upper_bound (> y): cho phép y bằng nhau nối tiếp nhau.
        auto it = upper_bound(tails.begin(), tails.end(), pt.second);
        if (it == tails.end()) tails.push_back(pt.second);
        else *it = pt.second;
    }
    cout << tails.size() << '\n';
    return 0;
}
