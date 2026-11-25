#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string line, word;
    getline(cin, line);
    stringstream ss(line);
    vector<string> words;
    while (ss >> word) words.push_back(word);
    for (size_t i = words.size(); i-- > 0; )
        cout << words[i] << (i > 0 ? ' ' : '\n');
    return 0;
}
