import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
r = data[1:1 + n]
left = [1] * n                        # chỉ xét bạn bên trái
for i in range(1, n):
    if r[i] > r[i - 1]:
        left[i] = left[i - 1] + 1
total, right = left[-1], 1            # right: chỉ xét bạn bên phải
for i in range(n - 2, -1, -1):
    right = right + 1 if r[i] > r[i + 1] else 1
    total += max(left[i], right)
print(total)
