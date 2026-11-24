#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Mã Gray phản xạ: G(n) = 0·G(n-1) nối với 1·đảo_ngược(G(n-1)).
vector<string> gray(int n) {
    if (n == 1) return {"0", "1"};
    vector<string> prev = gray(n - 1);
    vector<string> result;
    result.reserve(prev.size() * 2);
    for (const string& code : prev) result.push_back("0" + code);
    for (auto it = prev.rbegin(); it != prev.rend(); ++it) result.push_back("1" + *it);
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    for (const string& code : gray(n)) cout << code << "\n";
    return 0;
}
