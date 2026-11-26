import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
# Chỉ nút trong (2i + 1 < n) mới có con; mỗi nút phải >= các con.
ok = all(a[c] <= a[i] for i in range(n) for c in (2 * i + 1, 2 * i + 2) if c < n)
print('YES' if ok else 'NO')
