#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;

    unordered_map<long long, long long> seen;   // tổng tiền tố -> số lần đã gặp
    seen.reserve(n * 2);
    seen[0] = 1;                                 // tiền tố rỗng
    long long prefix = 0, count = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        prefix += x;
        auto it = seen.find(prefix - k);         // mỗi tiền tố trước bằng prefix - k cho một đoạn tổng k kết thúc tại i
        if (it != seen.end()) count += it->second;
        seen[prefix]++;
    }
    cout << count << "\n";
    return 0;
}
