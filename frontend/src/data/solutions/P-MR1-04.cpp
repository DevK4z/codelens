#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int n = s.size(), bestLen = 1, bestStart = 0;
    auto expand = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) l--, r++;
        int len = r - l - 1;                 // đoạn đối xứng là s[l+1 .. r-1]
        if (len > bestLen || (len == bestLen && l + 1 < bestStart)) {
            bestLen = len;
            bestStart = l + 1;
        }
    };
    for (int i = 0; i < n; i++) {
        expand(i, i);                        // tâm là một ký tự
        expand(i, i + 1);                    // tâm nằm giữa hai ký tự
    }
    cout << bestLen << '\n' << s.substr(bestStart, bestLen) << '\n';
    return 0;
}
