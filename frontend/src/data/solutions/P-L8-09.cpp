#include <iostream>
#include <vector>
using namespace std;

vector<long long> a;
vector<int> idx, tmp;
vector<long long> answer;

void sortCount(int lo, int hi) {           // sắp idx[lo, hi) theo a, đếm phần tử nhỏ hơn bên phải
    if (hi - lo <= 1) return;
    int mid = (lo + hi) / 2;
    sortCount(lo, mid);
    sortCount(mid, hi);
    int i = lo, j = mid, k = lo, rightTaken = 0;
    while (i < mid || j < hi) {
        if (j == hi || (i < mid && a[idx[i]] <= a[idx[j]])) {
            answer[idx[i]] += rightTaken;   // các phần tử phải đã ra trước đều nhỏ hơn
            tmp[k++] = idx[i++];
        } else {
            rightTaken++;
            tmp[k++] = idx[j++];
        }
    }
    for (int t = lo; t < hi; t++) idx[t] = tmp[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    a.resize(n);
    for (auto& x : a) cin >> x;
    idx.resize(n);
    tmp.resize(n);
    answer.assign(n, 0);
    for (int i = 0; i < n; i++) idx[i] = i;
    sortCount(0, n);
    for (int i = 0; i < n; i++) cout << answer[i] << (i + 1 < n ? ' ' : '\n');
    return 0;
}
