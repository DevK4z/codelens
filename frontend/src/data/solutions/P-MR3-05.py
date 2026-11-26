import sys
import heapq

data = list(map(int, sys.stdin.buffer.read().split()))
n, m, s = data[0], data[1], data[2]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v, w = data[3 + 3 * i:6 + 3 * i]
    adj[u].append((v, w))
INF = float('inf')
dist = [INF] * (n + 1)
dist[s] = 0
pq = [(0, s)]                         # (khoảng cách, đỉnh)
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:                   # bản ghi cũ
        continue
    for v, w in adj[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heapq.heappush(pq, (dist[v], v))
print(' '.join(str(x) if x != INF else '-1' for x in dist[1:]))
