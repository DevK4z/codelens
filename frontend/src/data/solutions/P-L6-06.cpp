#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<int> leftChild, rightChild;
int diameter = 0;

// Trả về chiều cao (số nút trên đường dài nhất xuống lá) và cập nhật đường kính.
int height(int v) {
    if (v == 0) return 0;
    int hl = height(leftChild[v]);
    int hr = height(rightChild[v]);
    diameter = max(diameter, hl + hr);   // đường đi gấp khúc tại v có hl + hr cạnh
    return 1 + max(hl, hr);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    leftChild.resize(n + 1);
    rightChild.resize(n + 1);
    for (int i = 1; i <= n; i++) {
        long long key;
        cin >> key >> leftChild[i] >> rightChild[i];
    }
    height(1);
    cout << diameter << "\n";
    return 0;
}
