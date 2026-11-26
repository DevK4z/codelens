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
    long long x;
    cin >> x;
    // Một lần duyệt: ghi vị trí đầu tiên gặp x và đếm mọi lần gặp.
    int first = -1, count = 0, pos = 1;
    for (Node* p = head; p; p = p->next, pos++)
        if (p->data == x) {
            if (first == -1) first = pos;
            count++;
        }
    cout << first << ' ' << count << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
