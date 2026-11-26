#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    // tails[L − 1] = phần tử cuối NHỎ NHẤT của một dãy con tăng độ dài L. tails luôn tăng dần,
    // nên vị trí của mỗi phần tử mới được tìm bằng tìm kiếm nhị phân.
    vector<long long> tails;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        // lower_bound (≥ x): x thay phần tử ≥ nó, nên hai số bằng nhau không nối tiếp nhau → tăng nghiêm ngặt.
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    cout << tails.size() << '\n';
    return 0;
}
