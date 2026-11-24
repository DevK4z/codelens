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

    // Khi fast tới cuối thì slow đi được nửa đường.
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    cout << slow->value << "\n";

    while (head) { Node* next = head->next; delete head; head = next; }
    return 0;
}
