#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string s;
vector<string> parts, result;

bool validPart(const string& p) {
    if (p.size() > 1 && p[0] == '0') return false;   // không có số 0 thừa ở đầu
    return stoi(p) <= 255;
}

void backtrack(size_t pos) {
    size_t left = s.size() - pos, need = 4 - parts.size();
    if (left < need || left > need * 3) return;       // không thể chia đủ phần còn lại
    if (need == 0) {
        result.push_back(parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3]);
        return;
    }
    for (size_t len = 1; len <= 3 && pos + len <= s.size(); len++) {
        string p = s.substr(pos, len);
        if (!validPart(p)) continue;
        parts.push_back(p);
        backtrack(pos + len);
        parts.pop_back();
    }
}

int main() {
    cin >> s;
    backtrack(0);
    sort(result.begin(), result.end());
    cout << result.size() << '\n';
    for (const string& ip : result) cout << ip << '\n';
    return 0;
}
