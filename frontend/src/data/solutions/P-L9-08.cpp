#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    unordered_map<string, vector<string>> groups;   // chữ ký -> các từ
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        string sig = w;
        sort(sig.begin(), sig.end());
        groups[sig].push_back(w);
    }
    vector<vector<string>> result;
    for (auto& [sig, words] : groups) {
        sort(words.begin(), words.end());
        result.push_back(words);
    }
    sort(result.begin(), result.end(), [](const vector<string>& a, const vector<string>& b) { return a[0] < b[0]; });
    cout << result.size() << '\n';
    for (const auto& g : result)
        for (size_t i = 0; i < g.size(); i++) cout << g[i] << (i + 1 < g.size() ? ' ' : '\n');
    return 0;
}
