#include <iostream>
#include <queue>
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
    int n;
    cin >> n;
    Node* root = nullptr;
    for (int i = 0; i < n; i++) {
        long long k;
        cin >> k;
        root = insert(root, k);
    }

    queue<Node*> q;
    q.push(root);
    bool first = true;
    while (!q.empty()) {
        size_t levelSize = q.size();   // số nút của mức hiện tại
        long long sum = 0;
        while (levelSize--) {
            Node* t = q.front();
            q.pop();
            sum += t->key;
            if (t->left) q.push(t->left);
            if (t->right) q.push(t->right);
        }
        cout << (first ? "" : " ") << sum;
        first = false;
    }
    cout << "\n";
    return 0;
}
