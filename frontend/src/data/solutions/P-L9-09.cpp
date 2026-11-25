#include <iostream>
#include <string>
using namespace std;

int main() {
    string s, t;
    cin >> s >> t;
    int need[26] = {0};               // need[c] > 0: cửa sổ còn thiếu c; < 0: đang thừa
    for (char c : t) need[c - 'a']++;
    int missing = t.size();
    int bestLen = -1, bestStart = 0;
    int l = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        if (need[s[r] - 'a']-- > 0) missing--;
        if (missing > 0) continue;
        while (need[s[l] - 'a'] < 0) need[s[l++] - 'a']++;     // bỏ ký tự thừa ở bên trái
        if (bestLen == -1 || r - l + 1 < bestLen) { bestLen = r - l + 1; bestStart = l; }
        need[s[l++] - 'a']++;                                 // bỏ s[l]: lại thiếu đúng một ký tự
        missing++;
    }
    if (bestLen == -1) cout << -1 << '\n';
    else cout << s.substr(bestStart, bestLen) << '\n';
    return 0;
}
