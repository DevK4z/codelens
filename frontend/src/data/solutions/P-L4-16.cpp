#include <iostream>
#include <string>
using namespace std;

struct Node {
    long long data;
    Node *prev, *next;
};

Node *head = nullptr, *tail = nullptr;

void pushFront(long long x) {
    Node* node = new Node{x, nullptr, head};
    if (head) head->prev = node; else tail = node;
    head = node;
}

void pushBack(long long x) {
    Node* node = new Node{x, tail, nullptr};
    if (tail) tail->next = node; else head = node;
    tail = node;
}

void popFront() {
    if (!head) return;
    Node* old = head;
    head = head->next;
    if (head) head->prev = nullptr; else tail = nullptr;   // vừa xóa nút cuối cùng
    delete old;
}

void popBack() {
    if (!tail) return;
    Node* old = tail;
    tail = tail->prev;
    if (tail) tail->next = nullptr; else head = nullptr;
    delete old;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        string op;
        cin >> op;
        long long x;
        if (op == "H") { cin >> x; pushFront(x); }
        else if (op == "T") { cin >> x; pushBack(x); }
        else if (op == "DH") popFront();
        else popBack();
    }
    if (!head) cout << "EMPTY\nEMPTY\n";
    else {
        for (Node* p = head; p; p = p->next) cout << (p == head ? "" : " ") << p->data;
        cout << '\n';
        for (Node* p = tail; p; p = p->prev) cout << (p == tail ? "" : " ") << p->data;   // đi ngược theo prev
        cout << '\n';
    }
    while (head) popFront();
    return 0;
}
