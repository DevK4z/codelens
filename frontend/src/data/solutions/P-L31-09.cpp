#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s;
    cin >> s;
    int n = s.size();
    // below[j] = f[i+1][j], here[j] = f[i][j]: số ký tự cần chèn cho đoạn s[i..j].
    vector<int> below(n, 0), here(n, 0);
    for (int i = n - 1; i >= 0; i--) {
        here[i] = 0;                               // một ký tự đã đối xứng
        for (int j = i + 1; j < n; j++) {
            if (s[i] == s[j]) here[j] = (i + 1 <= j - 1) ? below[j - 1] : 0;
            else here[j] = 1 + min(below[j], here[j - 1]);
        }
        swap(below, here);
    }
    cout << below[n - 1] << '\n';
    return 0;
}
