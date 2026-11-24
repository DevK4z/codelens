#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<pair<string, int>> a, tmp;   // (tên, điểm)

void mergeSort(int l, int r) {
    if (r - l <= 1) return;
    int mid = (l + r) / 2;
    mergeSort(l, mid);
    mergeSort(mid, r);
    int i = l, j = mid, k = l;
    while (i < mid && j < r) {
        if (a[i].second >= a[j].second) tmp[k++] = a[i++];   // ">=": bằng điểm thì giữ thứ tự cũ
        else tmp[k++] = a[j++];
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < r) tmp[k++] = a[j++];
    for (int x = l; x < r; x++) a[x] = tmp[x];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    a.resize(n);
    tmp.resize(n);
    for (auto& [name, score] : a) cin >> name >> score;
    mergeSort(0, n);
    for (const auto& [name, score] : a) cout << name << " " << score << "\n";
    return 0;
}
