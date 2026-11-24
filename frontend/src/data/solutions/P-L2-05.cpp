#include <iostream>
#include <string>
using namespace std;

// s[l..r] đối xứng khi hai đầu bằng nhau và phần ở giữa s[l+1..r-1] đối xứng.
bool isPalindrome(const string& s, int l, int r) {
    if (l >= r) return true;            // rỗng hoặc một ký tự
    if (s[l] != s[r]) return false;
    return isPalindrome(s, l + 1, r - 1);
}

int main() {
    string s;
    cin >> s;
    cout << (isPalindrome(s, 0, (int)s.size() - 1) ? "YES" : "NO") << "\n";
    return 0;
}
