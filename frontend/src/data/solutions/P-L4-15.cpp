#include <iostream>
using namespace std;

struct Node {
    long long data;
    Node* next;
};

// Trộn hai danh sách đã sắp bằng cách nối lại các nút (nút giả dummy làm đầu kết quả).
Node* merge(Node* a, Node* b) {
    Node dummy{0, nullptr};
    Node* tail = &dummy;
    while (a && b) {
        Node*& smaller = (a->data <= b->data) ? a : b;   // ≤ giữ thứ tự ổn định
        tail = tail->next = smaller;
        smaller = smaller->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}

Node* mergeSort(Node* head) {
    if (!head || !head->next) return head;
    // Con trỏ nhanh/chậm tìm giữa danh sách, rồi cắt làm hai nửa.
    Node *slow = head, *fast = head->next;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    Node* second = slow->next;
    slow->next = nullptr;
    return merge(mergeSort(head), mergeSort(second));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
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
    head = mergeSort(head);
    if (!head) cout << "EMPTY";
    for (Node* q = head; q; q = q->next) cout << (q == head ? "" : " ") << q->data;
    cout << '\n';
    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
