#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<string> nums(n);
    for (auto& s : nums) cin >> s;

    // x đứng trước y khi ghép "x rồi y" cho số lớn hơn "y rồi x".
    sort(nums.begin(), nums.end(), [](const string& x, const string& y) { return x + y > y + x; });

    if (nums[0] == "0") { cout << "0\n"; return 0; }   // số lớn nhất là 0 nghĩa là mọi số đều là 0
    for (const string& s : nums) cout << s;
    cout << "\n";
    return 0;
}
