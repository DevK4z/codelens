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
        long long v;
        cin >> v;
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else tail = tail->next = node;
    }
    long long x, y;
    cin >> x >> y;
    Node* p = head;
    while (p && p->data != x) p = p->next;
    if (p) p->next = new Node{y, p->next};   // nút mới trỏ tới nút sau p, rồi p trỏ tới nút mới
    if (!head) cout << "EMPTY";
    for (Node* q = head; q; q = q->next) cout << (q == head ? "" : " ") << q->data;
    cout << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
