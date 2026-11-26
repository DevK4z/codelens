#include <iostream>
using namespace std;

struct Node {
    long long data;
    Node *prev, *next;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    Node *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        long long v;
        cin >> v;
        Node* node = new Node{v, tail, nullptr};
        if (tail) tail->next = node; else head = node;
        tail = node;
    }
    // left đi từ đầu, right đi từ cuối; dừng khi gặp nhau (n lẻ) hoặc vừa vượt qua nhau (n chẵn).
    bool ok = true;
    Node *left = head, *right = tail;
    for (int step = 0; step < n / 2; step++) {
        if (left->data != right->data) { ok = false; break; }
        left = left->next;
        right = right->prev;
    }
    cout << (ok ? "YES" : "NO") << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
