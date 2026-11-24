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
    int n;
    cin >> n;
    Node* head = readList(n);

    if (head) {
        Node* odd = head;               // cuối danh sách các nút vị trí lẻ
        Node* evenHead = head->next;    // đầu danh sách các nút vị trí chẵn
        Node* even = evenHead;          // cuối danh sách các nút vị trí chẵn
        while (even && even->next) {
            odd->next = even->next;     // nút lẻ kế tiếp
            odd = odd->next;
            even->next = odd->next;     // nút chẵn kế tiếp
            even = even->next;
        }
        odd->next = evenHead;           // nối nhóm chẵn vào sau nhóm lẻ
    }

    for (Node* p = head; p; p = p->next) cout << p->value << (p->next ? " " : "\n");
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
