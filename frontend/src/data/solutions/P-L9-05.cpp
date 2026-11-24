#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s;
    cin >> s;

    vector<int> lastSeen(256, -1);   // vị trí gần nhất của mỗi ký tự (bảng băm trực tiếp theo mã ký tự)
    int best = 0, left = 0;          // cửa sổ s[left..right] không có ký tự lặp
    for (int right = 0; right < (int)s.size(); right++) {
        unsigned char c = s[right];
        if (lastSeen[c] >= left) left = lastSeen[c] + 1;   // ký tự c đã có trong cửa sổ: nhảy qua lần xuất hiện cũ
        lastSeen[c] = right;
        best = max(best, right - left + 1);
    }
    cout << best << "\n";
    return 0;
}
