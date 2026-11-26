import sys
from collections import deque

data = list(map(int, sys.stdin.buffer.read().split()))
n, m, s = data[0], data[1], data[2]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = data[3 + 2 * i], data[4 + 2 * i]
    adj[u].append(v)
    adj[v].append(u)
dist = [-1] * (n + 1)                 # -1: chưa thăm
dist[s] = 0
q = deque([s])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            q.append(v)
print(' '.join(map(str, dist[1:])))
