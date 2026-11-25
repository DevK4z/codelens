#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

struct P { long long x, y; };
vector<P> pts, buf;

long long sq(long long v) { return v * v; }

// Trả về bình phương khoảng cách nhỏ nhất trong pts[l, r); sau khi gọi, đoạn này được sắp theo y.
long long solve(int l, int r) {
    if (r - l <= 1) return (long long)9e18;
    int m = (l + r) / 2;
    long long midX = pts[m].x;
    long long d = min(solve(l, m), solve(m, r));
    // Trộn hai nửa theo y.
    merge(pts.begin() + l, pts.begin() + m, pts.begin() + m, pts.begin() + r, buf.begin() + l,
          [](const P& a, const P& b) { return a.y < b.y; });
    copy(buf.begin() + l, buf.begin() + r, pts.begin() + l);
    // Dải quanh đường chia, đã theo thứ tự y.
    vector<P> strip;
    for (int i = l; i < r; i++)
        if (sq(pts[i].x - midX) < d) strip.push_back(pts[i]);
    for (size_t i = 0; i < strip.size(); i++)
        for (size_t j = i + 1; j < strip.size() && sq(strip[j].y - strip[i].y) < d; j++)
            d = min(d, sq(strip[j].x - strip[i].x) + sq(strip[j].y - strip[i].y));
    return d;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    pts.resize(n);
    buf.resize(n);
    for (auto& p : pts) cin >> p.x >> p.y;
    sort(pts.begin(), pts.end(), [](const P& a, const P& b) { return a.x < b.x; });
    cout << solve(0, n) << '\n';
    return 0;
}
