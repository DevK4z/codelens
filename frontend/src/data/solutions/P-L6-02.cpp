#include <iostream>
using namespace std;

struct Node {
    long long key;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(long long k) : key(k) {}
};

// Chèn lặp (không đệ quy) để cây suy biến n = 1000 tầng cũng không tràn ngăn xếp.
Node* insert(Node* root, long long key) {
    Node* node = new Node(key);
    if (!root) return node;
    Node* cur = root;
    while (true) {
        Node*& child = key < cur->key ? cur->left : cur->right;
        if (!child) { child = node; return root; }
        cur = child;
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    Node* root = nullptr;
    for (int i = 0; i < n; i++) {
        long long k;
        cin >> k;
        root = insert(root, k);
    }
    while (q--) {
        long long u, v;
        cin >> u >> v;
        Node* cur = root;
        while (true) {
            if (u < cur->key && v < cur->key) cur = cur->left;
            else if (u > cur->key && v > cur->key) cur = cur->right;
            else break;   // u và v tách về hai phía (hoặc một trong hai là cur)
        }
        cout << cur->key << "\n";
    }
    return 0;
}
