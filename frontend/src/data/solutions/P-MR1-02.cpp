#include <iostream>
#include <string>
using namespace std;

int main() {
    string s, out;
    cin >> s;
    size_t i = 0;
    while (i < s.size()) {
        size_t j = i;
        while (j < s.size() && s[j] == s[i]) j++;     // [i, j) là một loạt
        out += s[i];
        if (j - i > 1) out += to_string(j - i);
        i = j;
    }
    cout << out << '\n';
    return 0;
}
