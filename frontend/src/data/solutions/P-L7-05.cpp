#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> count(101, 0);    // count[v] = số lần điểm v xuất hiện
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        count[v]++;
    }

    bool first = true;
    for (int v = 0; v <= 100; v++) {
        for (int c = 0; c < count[v]; c++) {
            cout << (first ? "" : " ") << v;
            first = false;
        }
    }
    cout << "\n";
    return 0;
}
