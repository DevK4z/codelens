#include <iostream>
using namespace std;

// Chuyển n đĩa từ cọc from sang cọc to, dùng cọc via làm trung gian.
void hanoi(int n, char from, char via, char to) {
    if (n == 0) return;
    hanoi(n - 1, from, to, via);          // dọn n − 1 đĩa sang cọc trung gian
    cout << from << ' ' << to << '\n';    // chuyển đĩa lớn nhất
    hanoi(n - 1, via, from, to);          // đặt n − 1 đĩa lên trên nó
}

int main() {
    int n;
    cin >> n;
    cout << (1 << n) - 1 << '\n';
    hanoi(n, 'A', 'B', 'C');
    return 0;
}
