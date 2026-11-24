#include <iostream>
using namespace std;

struct Node {
    long long value;
    Node* next;
};

Node* readList() {
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
    return head;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    Node* a = readList();
    Node* b = readList();

    Node dummy{0, nullptr};
    Node* tail = &dummy;
    while (a && b) {
        if (a->value <= b->value) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;   // phần còn lại đã được sắp sẵn

    for (Node* p = dummy.next; p; p = p->next) cout << p->value << (p->next ? " " : "\n");
    for (Node* p = dummy.next; p;) { Node* next = p->next; delete p; p = next; }
    return 0;
}
