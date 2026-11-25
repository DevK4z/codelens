#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string s, p;
    cin >> s >> p;
    int m = p.size();
    vector<int> pi(m, 0);           // pi[i]: tiền tố dài nhất của p cũng là hậu tố của p[0..i]
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && p[i] != p[k]) k = pi[k - 1];
        if (p[i] == p[k]) k++;
        pi[i] = k;
    }
    vector<int> pos;
    for (int i = 0, k = 0; i < (int)s.size(); i++) {
        while (k > 0 && s[i] != p[k]) k = pi[k - 1];   // không khớp: lùi theo pi, không lùi i
        if (s[i] == p[k]) k++;
        if (k == m) {
            pos.push_back(i - m + 2);                  // vị trí bắt đầu, đánh số từ 1
            k = pi[k - 1];                             // tìm tiếp lần xuất hiện chồng lên
        }
    }
    cout << pos.size() << '\n';
    for (size_t i = 0; i < pos.size(); i++) cout << pos[i] << (i + 1 < pos.size() ? ' ' : '\n');
    return 0;
}
