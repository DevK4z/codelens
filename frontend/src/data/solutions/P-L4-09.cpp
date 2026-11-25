#include <iostream>
using namespace std;

struct Node {
    long long val;
    Node* next;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    Node dummy{0, nullptr};
    Node* tail = &dummy;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        tail->next = new Node{x, nullptr};
        tail = tail->next;
    }

    Node* prevTail = &dummy;                      // đuôi của phần đã xử lý
    while (true) {
        Node* check = prevTail->next;             // còn đủ k nút không?
        int cnt = 0;
        while (check && cnt < k) { check = check->next; cnt++; }
        if (cnt < k) break;

        Node* groupHead = prevTail->next;         // sau khi đảo sẽ thành đuôi nhóm
        Node* prev = check;                       // nút đầu nhóm mới trỏ tới phần còn lại
        Node* cur = groupHead;
        for (int i = 0; i < k; i++) {
            Node* nx = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nx;
        }
        prevTail->next = prev;                    // prev là đầu nhóm sau khi đảo
        prevTail = groupHead;
    }

    for (Node* p = dummy.next; p; p = p->next) cout << p->val << (p->next ? ' ' : '\n');
    for (Node* p = dummy.next; p; ) { Node* nx = p->next; delete p; p = nx; }
    return 0;
}
