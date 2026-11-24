#include <iostream>
using namespace std;

struct Node {
    long long value;
    Node* next;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;

    // Thêm vào cuối danh sách bằng con trỏ tail: O(1) mỗi lần.
    Node* head = nullptr;
    Node* tail = nullptr;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        Node* node = new Node{x, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    // Đảo con trỏ next tại chỗ.
    Node* prev = nullptr;
    Node* cur = head;
    while (cur) {
        Node* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    head = prev;

    for (Node* p = head; p; p = p->next) cout << p->value << (p->next ? " " : "\n");

    while (head) { Node* next = head->next; delete head; head = next; }   // giải phóng bộ nhớ
    return 0;
}
