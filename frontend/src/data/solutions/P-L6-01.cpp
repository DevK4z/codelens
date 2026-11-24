#include <iostream>
#include <vector>
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

void postorder(Node* t, vector<long long>& out) {
    if (!t) return;
    postorder(t->left, out);
    postorder(t->right, out);
    out.push_back(t->key);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    Node* root = nullptr;
    for (int i = 0; i < n; i++) {
        long long k;
        cin >> k;
        root = insert(root, k);
    }
    vector<long long> out;
    postorder(root, out);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    return 0;
}
