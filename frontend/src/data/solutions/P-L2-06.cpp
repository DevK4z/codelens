#include <iostream>
#include <vector>
using namespace std;

int n;
long long target;
vector<long long> a;

// Số cách đặt dấu cho a[i..n-1] để tổng cuối cùng bằng target, biết tổng hiện tại là sum.
long long countWays(int i, long long sum) {
    if (i == n) return sum == target ? 1 : 0;
    return countWays(i + 1, sum + a[i]) + countWays(i + 1, sum - a[i]);
}

int main() {
    cin >> n >> target;
    a.resize(n);
    for (auto& x : a) cin >> x;
    cout << countWays(0, 0) << "\n";
    return 0;
}
