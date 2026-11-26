import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[0], data[1]
edges = sorted((data[4 + 3 * i], data[2 + 3 * i], data[3 + 3 * i]) for i in range(m))   # (w, u, v) theo chi phí
parent = list(range(n + 1))
size = [1] * (n + 1)


def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]  # nén đường đi
        x = parent[x]
    return x


total = used = 0
for w, u, v in edges:
    a, b = find(u), find(v)
    if a == b:                         # đã cùng tập: cạnh này tạo chu trình
        continue
    if size[a] < size[b]:
        a, b = b, a
    parent[b] = a                      # hợp theo kích thước
    size[a] += size[b]
    total += w
    used += 1
print(total if used == n - 1 else -1)
