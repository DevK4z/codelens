import sys
import heapq

data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[0], data[1]
adj = [[] for _ in range(n + 1)]
indeg = [0] * (n + 1)
for i in range(m):
    u, v = data[2 + 2 * i], data[3 + 2 * i]
    adj[u].append(v)
    indeg[v] += 1
ready = [v for v in range(1, n + 1) if indeg[v] == 0]   # các môn đã đủ điều kiện
heapq.heapify(ready)                  # min-heap: luôn học môn nhỏ nhất được phép
order = []
while ready:
    u = heapq.heappop(ready)
    order.append(u)
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            heapq.heappush(ready, v)
print(' '.join(map(str, order)) if len(order) == n else 'IMPOSSIBLE')   # thiếu môn: có chu trình
