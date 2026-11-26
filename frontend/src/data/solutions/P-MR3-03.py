import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[0], data[1]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = data[2 + 2 * i], data[3 + 2 * i]
    adj[u].append(v)
    adj[v].append(u)

color = [-1] * (n + 1)
ok = True
for s in range(1, n + 1):
    if color[s] != -1 or not ok:      # mỗi thành phần tô riêng
        continue
    color[s] = 0
    queue = [s]
    for u in queue:
        for v in adj[u]:
            if color[v] == -1:
                color[v] = 1 - color[u]
                queue.append(v)
            elif color[v] == color[u]:   # hai đầu cùng màu: có chu trình lẻ
                ok = False
print('YES' if ok else 'NO')
