#include <iostream>
using namespace std;

struct Node {
    long long data;
    Node* next;
};

int main() {
    int n;
    cin >> n;
    Node *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        char op;
        long long x;
        cin >> op >> x;
        if (op == 'H') {
            head = new Node{x, head};          // nút mới trỏ tới đầu cũ
            if (!tail) tail = head;
        } else {
            Node* node = new Node{x, nullptr};
            if (!head) head = tail = node;
            else tail = tail->next = node;
        }
    }
    if (!head) cout << "EMPTY";
    for (Node* p = head; p; p = p->next) cout << (p == head ? "" : " ") << p->data;
    cout << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
