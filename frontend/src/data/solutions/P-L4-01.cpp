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
    Node* head = nullptr;
    Node* tail = nullptr;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        Node* node = new Node{x, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    for (Node* p = head; p && p->next;) {
        if (p->next->value == p->value) {
            Node* dup = p->next;
            p->next = dup->next;   // bỏ nút trùng khỏi danh sách
            delete dup;
        } else {
            p = p->next;
        }
    }

    for (Node* p = head; p; p = p->next) cout << p->value << (p->next ? " " : "\n");
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
