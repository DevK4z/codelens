#include <iostream>
#include <vector>
using namespace std;

struct Node {
    int id;
    Node* next;
};

int main() {
    int n, k;
    cin >> n >> k;

    Node* head = new Node{1, nullptr};
    Node* tail = head;
    for (int i = 2; i <= n; i++) { tail->next = new Node{i, nullptr}; tail = tail->next; }
    tail->next = head;                 // khép vòng

    Node* prev = tail;                 // nút đứng trước người được đếm "1"
    vector<int> order;
    while ((int)order.size() < n) {
        for (int step = 1; step < k; step++) prev = prev->next;
        Node* out = prev->next;        // người được đếm tới k
        order.push_back(out->id);
        prev->next = out->next;        // loại khỏi vòng, đếm tiếp từ người ngay sau
        delete out;
    }
    for (int i = 0; i < n; i++) cout << order[i] << (i + 1 < n ? " " : "\n");
    return 0;
}
