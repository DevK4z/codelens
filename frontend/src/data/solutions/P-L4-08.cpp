#include <iostream>
#include <string>
using namespace std;

struct Node {
    int digit;
    Node* next;
};

// Danh sách theo thứ tự hàng đơn vị trước: chèn từng chữ số vào đầu.
Node* build(const string& s) {
    Node* head = nullptr;
    for (char c : s) head = new Node{c - '0', head};
    return head;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string a, b;
    cin >> a >> b;
    Node* x = build(a);
    Node* y = build(b);

    Node dummy{0, nullptr};
    Node* tail = &dummy;
    int carry = 0;
    for (Node *p = x, *q = y; p || q || carry; ) {
        int sum = carry + (p ? p->digit : 0) + (q ? q->digit : 0);
        tail->next = new Node{sum % 10, nullptr};
        tail = tail->next;
        carry = sum / 10;
        if (p) p = p->next;
        if (q) q = q->next;
    }

    string out;                                   // kết quả đang ở thứ tự hàng đơn vị trước
    for (Node* p = dummy.next; p; p = p->next) out += char('0' + p->digit);
    cout << string(out.rbegin(), out.rend()) << '\n';

    Node* lists[3] = {x, y, dummy.next};
    for (Node* p : lists)
        while (p) { Node* nx = p->next; delete p; p = nx; }
    return 0;
}
