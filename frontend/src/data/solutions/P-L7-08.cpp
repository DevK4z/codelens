#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<string> words(n);
    for (auto& w : words) cin >> w;
    sort(words.begin(), words.end(), [](const string& a, const string& b) {
        if (a.size() != b.size()) return a.size() < b.size();   // ngắn hơn đứng trước
        return a < b;                                           // cùng độ dài: theo từ điển
    });
    for (const auto& w : words) cout << w << '\n';
    return 0;
}
