#include <iostream>
#include <stack>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n), answer(n, -1);
    for (auto& x : a) cin >> x;

    stack<int> waiting;   // chỉ số chưa có phần tử lớn hơn bên phải
    for (int i = 0; i < n; i++) {
        while (!waiting.empty() && a[waiting.top()] < a[i]) {
            answer[waiting.top()] = a[i];
            waiting.pop();
        }
        waiting.push(i);
    }
    for (int i = 0; i < n; i++) cout << answer[i] << (i + 1 < n ? " " : "\n");
    return 0;
}
