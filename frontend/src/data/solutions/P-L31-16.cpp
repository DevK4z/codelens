#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    // ways[v] = số cách viết v chỉ dùng các số hạng ≤ x (x tăng dần qua vòng ngoài).
    // Duyệt số hạng ở vòng NGOÀI nên mỗi cách chỉ được đếm một lần, không đếm lại các hoán vị.
    vector<long long> ways(n + 1, 0);
    ways[0] = 1;
    for (int x = 1; x <= n; x++)
        for (int v = x; v <= n; v++) ways[v] += ways[v - x];
    cout << ways[n] << '\n';
    return 0;
}
