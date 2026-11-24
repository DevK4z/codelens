#include <iostream>
using namespace std;

struct Node {
    long long key;
    int size = 1;             // số nút của cây con gốc tại đây
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(long long k) : key(k) {}
};

int sizeOf(Node* t) { return t ? t->size : 0; }

void insert(Node*& root, long long key) {
    Node** cur = &root;
    while (*cur) {
        (*cur)->size++;       // khóa mới sẽ nằm trong cây con này
        cur = key < (*cur)->key ? &(*cur)->left : &(*cur)->right;
    }
    *cur = new Node(key);
}

long long kth(Node* t, int k) {
    while (true) {
        int leftSize = sizeOf(t->left);
        if (k <= leftSize) t = t->left;                 // nằm trong cây con trái
        else if (k == leftSize + 1) return t->key;      // chính là nút này
        else { k -= leftSize + 1; t = t->right; }       // bỏ qua cây trái và nút này
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    Node* root = nullptr;
    for (int i = 0; i < n; i++) {
        long long key;
        cin >> key;
        insert(root, key);
    }
    while (q--) {
        int k;
        cin >> k;
        cout << kth(root, k) << "\n";
    }
    return 0;
}
