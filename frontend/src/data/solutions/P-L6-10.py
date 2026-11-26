import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
key = [0] * (n + 1)
L = [0] * (n + 1)
R = [0] * (n + 1)
for i in range(1, n + 1):
    key[i], L[i], R[i] = data[3 * i - 2:3 * i + 1]

# Thứ tự BFS; duyệt ngược lại thì mọi con được xử lý trước cha (như hậu tự, không cần đệ quy).
order = [1]
for v in order:
    order += [c for c in (L[v], R[v]) if c]
down = [0] * (n + 1)                  # tổng lớn nhất của đường đi xuống bắt đầu tại v
best = None
for v in reversed(order):
    left = max(0, down[L[v]]) if L[v] else 0
    right = max(0, down[R[v]]) if R[v] else 0
    through = key[v] + left + right   # đường đi gấp khúc tại v
    best = through if best is None else max(best, through)
    down[v] = key[v] + max(left, right)
print(best)
