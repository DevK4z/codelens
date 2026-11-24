#include <iostream>
#include <vector>
using namespace std;

void print(const vector<long long>& v) {
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << (i + 1 < v.size() ? " " : "\n");
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cin >> m;
    vector<long long> b(m);
    for (auto& x : b) cin >> x;

    vector<long long> uni, inter;
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (a[i] < b[j]) uni.push_back(a[i++]);
        else if (a[i] > b[j]) uni.push_back(b[j++]);
        else { uni.push_back(a[i]); inter.push_back(a[i]); i++; j++; }
    }
    while (i < n) uni.push_back(a[i++]);
    while (j < m) uni.push_back(b[j++]);

    print(uni);
    if (inter.empty()) cout << "NONE\n";
    else print(inter);
    return 0;
}
