import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, m = data[0], data[1]
adj = [[] for _ in range(n + 1)]      # (đỉnh kề, chỉ số cạnh)
for i in range(m):
    u, v = data[2 + 2 * i], data[3 + 2 * i]
    adj[u].append((v, i))
    adj[v].append((u, i))

tin = [0] * (n + 1)
low = [0] * (n + 1)
timer = bridges = 0
# DFS bằng stack tự quản lý (Python giới hạn độ sâu đệ quy): mỗi phần tử là (đỉnh, cạnh tới, vị trí trong adj).
for root in range(1, n + 1):
    if tin[root]:
        continue
    timer += 1
    tin[root] = low[root] = timer
    stack = [(root, -1, 0)]
    while stack:
        u, edge, i = stack[-1]
        if i < len(adj[u]):
            stack[-1] = (u, edge, i + 1)
            v, eid = adj[u][i]
            if eid == edge:            # không đi ngược lại đúng cạnh vừa tới
                continue
            if tin[v]:
                low[u] = min(low[u], tin[v])   # cạnh ngược
            else:
                timer += 1
                tin[v] = low[v] = timer
                stack.append((v, eid, 0))
        else:                          # xong u: cập nhật cha
            stack.pop()
            if stack:
                p = stack[-1][0]
                low[p] = min(low[p], low[u])
                if low[u] > tin[p]:    # cây con của u không vòng về được
                    bridges += 1
print(bridges)
