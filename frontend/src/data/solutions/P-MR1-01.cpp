#include <cctype>
#include <iostream>
#include <sstream>
#include <string>
using namespace std;

int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);              // tách từ, tự bỏ dấu cách thừa
    string word, result;
    while (ss >> word) {
        for (size_t i = 0; i < word.size(); i++) {
            unsigned char c = word[i];
            word[i] = i == 0 ? toupper(c) : tolower(c);
        }
        if (!result.empty()) result += ' ';
        result += word;
    }
    cout << result << '\n';
    return 0;
}
