#include <iostream>
#include <string>
using namespace std;

int main() {
    string num;
    int k;
    cin >> num >> k;

    // Giữ một "stack" chữ số tăng dần: gặp chữ số nhỏ hơn đỉnh thì xóa đỉnh (nếu còn lượt).
    string kept;
    for (char c : num) {
        while (k > 0 && !kept.empty() && kept.back() > c) {
            kept.pop_back();
            k--;
        }
        kept.push_back(c);
    }
    kept.resize(kept.size() - k);            // còn lượt xóa: bỏ ở cuối (các chữ số lớn nhất)

    size_t start = kept.find_first_not_of('0');
    cout << (start == string::npos ? "0" : kept.substr(start)) << "\n";
    return 0;
}
