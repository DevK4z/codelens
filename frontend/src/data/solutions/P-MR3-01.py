import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[0], data[1]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = data[2 + 2 * i], data[3 + 2 * i]
    adj[u].append(v)
    adj[v].append(u)

visited = [False] * (n + 1)
components = 0
for s in range(1, n + 1):
    if visited[s]:
        continue
    components += 1                   # s mở ra một thành phần mới
    visited[s] = True
    queue = [s]
    for u in queue:                   # BFS: duyệt list trong khi nối thêm vào cuối
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)
print(components)
