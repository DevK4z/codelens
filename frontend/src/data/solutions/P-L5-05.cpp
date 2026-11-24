#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string path;
    cin >> path;

    vector<string> st;          // dùng vector như ngăn xếp để in được từ đáy lên đỉnh
    stringstream ss(path);
    string part;
    while (getline(ss, part, '/')) {
        if (part.empty() || part == ".") continue;      // "//" hoặc thư mục hiện tại
        if (part == "..") { if (!st.empty()) st.pop_back(); }
        else st.push_back(part);                         // kể cả "..." là tên thư mục bình thường
    }

    string result;
    for (const string& dir : st) result += "/" + dir;
    cout << (result.empty() ? "/" : result) << "\n";
    return 0;
}
