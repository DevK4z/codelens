import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
key = [0] * (n + 1)
left = [0] * (n + 1)
right = [0] * (n + 1)
for i in range(1, n + 1):
    key[i], left[i], right[i] = data[3 * i - 2:3 * i + 1]

# Mọi khóa trong cây con gốc v phải thuộc khoảng mở (lo, hi). Dùng stack thay cho đệ quy.
ok = True
stack = [(1, float('-inf'), float('inf'))]
while stack and ok:
    v, lo, hi = stack.pop()
    if v == 0:
        continue
    if not lo < key[v] < hi:
        ok = False
    else:
        stack.append((left[v], lo, key[v]))
        stack.append((right[v], key[v], hi))
print('YES' if ok else 'NO')
