#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long W;
    cin >> n >> W;
    vector<long long> w(n);
    for (auto& x : w) cin >> x;
    sort(w.begin(), w.end());

    int lightest = 0, heaviest = n - 1, boats = 0;
    while (lightest <= heaviest) {
        if (lightest < heaviest && w[lightest] + w[heaviest] <= W) lightest++;  // ghép được hai người
        heaviest--;                                                             // người nặng nhất lên thuyền
        boats++;
    }
    cout << boats << "\n";
    return 0;
}
