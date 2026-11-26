import sys

data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
a = data[2:2 + n]


def dfs(i, total):
    """Số tập con của a[i:] làm tổng hiện tại thành đúng m."""
    if total > m:                     # mọi a[i] dương nên tổng chỉ tăng: cắt nhánh
        return 0
    if i == n:
        return 1 if total == m else 0
    return dfs(i + 1, total) + dfs(i + 1, total + a[i])


print(dfs(0, 0))                      # M ≥ 1 nên tập rỗng không bao giờ được đếm
