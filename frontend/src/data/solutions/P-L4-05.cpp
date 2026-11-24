#include <iostream>
using namespace std;

struct Node {
    long long value;
    Node* next;
};

Node* readList(int n) {
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
    int n, k;
    cin >> n >> k;
    Node* head = readList(n);

    // Nút giả đứng trước head để xóa được cả nút đầu mà không cần xử lý riêng.
    Node dummy{0, head};
    Node* lead = &dummy;
    Node* trail = &dummy;
    for (int i = 0; i < k; i++) lead = lead->next;   // lead đi trước k bước
    while (lead->next) {                              // khi lead ở nút cuối, trail đứng ngay trước nút cần xóa
        lead = lead->next;
        trail = trail->next;
    }
    Node* removed = trail->next;
    trail->next = removed->next;
    delete removed;
    head = dummy.next;

    if (!head) cout << "EMPTY\n";
    for (Node* p = head; p; p = p->next) cout << p->value << (p->next ? " " : "\n");
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
