#include <algorithm>
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    deque<int> maxQ, minQ;     // chỉ số; giá trị giảm dần / tăng dần
    int best = 0, l = 0;
    for (int r = 0; r < n; r++) {
        while (!maxQ.empty() && a[maxQ.back()] <= a[r]) maxQ.pop_back();
        maxQ.push_back(r);
        while (!minQ.empty() && a[minQ.back()] >= a[r]) minQ.pop_back();
        minQ.push_back(r);
        while (a[maxQ.front()] - a[minQ.front()] > k) {   // thu hẹp từ trái
            l++;
            if (maxQ.front() < l) maxQ.pop_front();
            if (minQ.front() < l) minQ.pop_front();
        }
        best = max(best, r - l + 1);
    }
    cout << best << '\n';
    return 0;
}
