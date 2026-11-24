#include <iostream>
using namespace std;

// Tổng các chữ số của n, viết đệ quy.
unsigned long long digitSum(unsigned long long n) {
    if (n < 10) return n;                 // điều kiện dừng: chỉ còn một chữ số
    return n % 10 + digitSum(n / 10);     // chữ số cuối + tổng chữ số phần còn lại
}

int main() {
    unsigned long long n;
    cin >> n;
    cout << digitSum(n) << "\n";
    return 0;
}
