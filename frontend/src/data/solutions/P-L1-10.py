import sys

data = sys.stdin.read().split()
m, n = int(data[0]), int(data[1])
a = [data[2 + i * n:2 + (i + 1) * n] for i in range(m)]
top, bottom, left, right = 0, m - 1, 0, n - 1
out = []
while top <= bottom and left <= right:
    out += [a[top][j] for j in range(left, right + 1)]
    out += [a[i][right] for i in range(top + 1, bottom + 1)]
    if top < bottom:                  # còn hàng dưới khác hàng trên
        out += [a[bottom][j] for j in range(right - 1, left - 1, -1)]
    if left < right:                  # còn cột trái khác cột phải
        out += [a[i][left] for i in range(bottom - 1, top, -1)]
    top, bottom, left, right = top + 1, bottom - 1, left + 1, right - 1
print(' '.join(out))
