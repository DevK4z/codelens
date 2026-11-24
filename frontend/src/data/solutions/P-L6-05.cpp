#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

vector<long long> pre, post;
unordered_map<long long, int> posInorder;   // khóa -> vị trí trong trung tự (tra O(1))
int nextPre = 0;                             // phần tử tiếp theo của tiền tự là gốc của cây con đang dựng

// Dựng cây con có các khóa nằm ở inorder[lo..hi] và ghi hậu tự của nó.
void build(int lo, int hi) {
    if (lo > hi) return;
    long long root = pre[nextPre++];
    int mid = posInorder[root];
    build(lo, mid - 1);       // cây con trái đứng ngay sau gốc trong tiền tự
    build(mid + 1, hi);
    post.push_back(root);     // hậu tự: trái, phải, rồi gốc
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    pre.resize(n);
    for (auto& x : pre) cin >> x;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        posInorder[x] = i;
    }
    build(0, n - 1);
    for (int i = 0; i < n; i++) cout << post[i] << (i + 1 < n ? " " : "\n");
    return 0;
}
