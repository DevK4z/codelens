import sys

data = sys.stdin.read().split()
n, S = int(data[0]), int(data[1])
a = list(map(int, data[2:2 + n]))
total = 0                             # tổng cửa sổ a[l..r]
best = l = 0
for r in range(n):
    total += a[r]
    while total > S:                  # thu hẹp từ trái cho tới khi hợp lệ
        total -= a[l]
        l += 1
    best = max(best, r - l + 1)
print(best)
