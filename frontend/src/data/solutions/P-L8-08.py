import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
out = []
width = 1
while width < n:
    merged = []
    for lo in range(0, n, 2 * width):
        mid, hi = min(lo + width, n), min(lo + 2 * width, n)
        i, j = lo, mid
        while i < mid and j < hi:
            if a[j] < a[i]:           # ổn định: bằng nhau lấy bên trái
                merged.append(a[j])
                j += 1
            else:
                merged.append(a[i])
                i += 1
        merged += a[i:mid] + a[j:hi]
    a = merged
    out.append(' '.join(map(str, a)))
    width *= 2
print('\n'.join(out))
