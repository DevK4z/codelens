#include <iostream>
using namespace std;

struct Node {
    int id;
    Node* next;
};

int main() {
    int n, k;
    cin >> n >> k;
    // Dựng vòng 1 → 2 → … → n → 1. prev là nút ĐỨNG TRƯỚC người sẽ được đếm số 1.
    Node* first = new Node{1, nullptr};
    Node* prev = first;
    for (int i = 2; i <= n; i++) prev = prev->next = new Node{i, nullptr};
    prev->next = first;
    for (int alive = n; alive > 1; alive--) {
        // Đi k − 1 bước tới nút đứng trước người bị loại. Bỏ các vòng thừa bằng (k − 1) mod alive,
        // nên mỗi lượt đi tối đa alive − 1 bước dù k lớn.
        for (int s = (k - 1) % alive; s > 0; s--) prev = prev->next;
        Node* out = prev->next;
        prev->next = out->next;   // nối qua người bị loại; đếm tiếp từ out->next
        delete out;
    }
    cout << prev->id << '\n';
    delete prev;
    return 0;
}
