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
        long long x;
        cin >> x;
        Node* node = new Node{x, nullptr};
        if (!head) head = tail = node;    // danh sách đang rỗng
        else tail = tail->next = node;    // nối vào sau tail rồi dời tail
    }
    if (!head) cout << "EMPTY";
    for (Node* p = head; p; p = p->next) cout << (p == head ? "" : " ") << p->data;
    cout << '\n';
    while (head) {                         // giải phóng từng nút
        Node* next = head->next;
        delete head;
        head = next;
    }
    return 0;
}
