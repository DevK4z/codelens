import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
lo, hi = 0, n - 1                     # đỉnh luôn nằm trong [lo, hi]
while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] < a[mid + 1]:           # sườn lên: đỉnh ở bên phải
        lo = mid + 1
    else:                             # sườn xuống hoặc chính là đỉnh
        hi = mid
print(lo + 1)
