#include <climits>
#include <iostream>
#include <vector>
using namespace std;

vector<long long> key;
vector<int> leftChild, rightChild;

// Mọi khóa trong cây con gốc v phải thuộc khoảng mở (lo, hi).
bool isBST(int v, long long lo, long long hi) {
    if (v == 0) return true;
    if (key[v] <= lo || key[v] >= hi) return false;
    return isBST(leftChild[v], lo, key[v]) && isBST(rightChild[v], key[v], hi);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    key.resize(n + 1);
    leftChild.resize(n + 1);
    rightChild.resize(n + 1);
    for (int i = 1; i <= n; i++) cin >> key[i] >> leftChild[i] >> rightChild[i];
    cout << (isBST(1, LLONG_MIN, LLONG_MAX) ? "YES" : "NO") << "\n";
    return 0;
}
