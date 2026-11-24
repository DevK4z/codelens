#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long d;
    cin >> n >> d;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());   // thứ tự không ảnh hưởng số cặp, nên được phép sắp xếp

    long long pairs = 0;
    int left = 0;
    for (int right = 0; right < n; right++) {
        while (a[right] - a[left] > d) left++;   // a[left..right-1] đều chênh với a[right] không quá d
        pairs += right - left;
    }
    cout << pairs << "\n";
    return 0;
}
