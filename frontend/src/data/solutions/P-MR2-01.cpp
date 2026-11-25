#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<long long> heap;   // min-heap: heap[i] <= heap[2i+1], heap[2i+2]

void push(long long x) {
    heap.push_back(x);
    size_t i = heap.size() - 1;
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {    // vun lên
        swap(heap[(i - 1) / 2], heap[i]);
        i = (i - 1) / 2;
    }
}

void pop() {
    heap[0] = heap.back();
    heap.pop_back();
    size_t i = 0;
    while (true) {                                     // vun xuống
        size_t l = 2 * i + 1, r = 2 * i + 2, smallest = i;
        if (l < heap.size() && heap[l] < heap[smallest]) smallest = l;
        if (r < heap.size() && heap[r] < heap[smallest]) smallest = r;
        if (smallest == i) break;
        swap(heap[i], heap[smallest]);
        i = smallest;
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        string op;
        cin >> op;
        if (op == "push") {
            long long x;
            cin >> x;
            push(x);
        } else if (heap.empty()) {
            cout << "EMPTY\n";
        } else {
            cout << heap[0] << '\n';
            if (op == "pop") pop();
        }
    }
    return 0;
}
