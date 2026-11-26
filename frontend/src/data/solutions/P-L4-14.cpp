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
    // link trỏ vào ô con trỏ đang dẫn tới nút hiện tại (head hoặc next của nút trước),
    // nên xóa nút đầu và xóa nút giữa được xử lý giống hệt nhau.
    Node** link = &head;
    while (*link) {
        Node* cur = *link;
        if (cur->data == x) {
            *link = cur->next;   // nối qua nút cần xóa
            delete cur;
        } else {
            link = &cur->next;
        }
    }
    if (!head) cout << "EMPTY";
    for (Node* q = head; q; q = q->next) cout << (q == head ? "" : " ") << q->data;
    cout << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
