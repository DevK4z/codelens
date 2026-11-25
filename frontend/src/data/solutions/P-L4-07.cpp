#include <iostream>
using namespace std;

struct Node {
    long long val;
    Node* next;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, k;
    cin >> n >> k;
    Node* head = nullptr;
    Node* tail = nullptr;
    for (long long i = 0; i < n; i++) {
        long long x;
        cin >> x;
        Node* node = new Node{x, nullptr};
        if (!head) head = node; else tail->next = node;
        tail = node;
    }

    long long steps = n - k % n;          // đuôi mới cách đầu cũ (steps - 1) bước
    tail->next = head;                    // nối thành vòng
    Node* newTail = tail;
    for (long long i = 0; i < steps; i++) newTail = newTail->next;
    head = newTail->next;
    newTail->next = nullptr;              // cắt vòng

    for (Node* p = head; p; p = p->next) cout << p->val << (p->next ? ' ' : '\n');
    while (head) { Node* nx = head->next; delete head; head = nx; }
    return 0;
}
