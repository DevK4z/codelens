#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s;
    cin >> s;
    int n = s.size();
    vector<int> pi(n, 0);       // pi[i]: border dài nhất của s[0..i]
    for (int i = 1, k = 0; i < n; i++) {
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    cout << n - pi[n - 1] << '\n';   // border dài nhất <-> chu kỳ nhỏ nhất
    return 0;
}
