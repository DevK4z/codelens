#include <iostream>
#include <vector>
using namespace std;

vector<int> parts;

// Còn phải phân tích left, số hạng tiếp theo ≥ minPart (giữ dãy không giảm, tránh trùng hoán vị).
void gen(int left, int minPart) {
    if (left == 0) {
        for (size_t i = 0; i < parts.size(); i++) cout << (i ? "+" : "") << parts[i];
        cout << '\n';
        return;
    }
    for (int x = minPart; x <= left; x++) {
        parts.push_back(x);
        gen(left - x, x);
        parts.pop_back();
    }
}

int main() {
    ios::sync_with_stdio(false);
    int n;
    cin >> n;
    gen(n, 1);
    return 0;
}
