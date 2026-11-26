import sys

n, x1, y1, x2, y2 = map(int, sys.stdin.read().split())
# Bàn cờ có viền rộng 2 ô quanh n × n ô (đánh dấu -2 = ra ngoài) và lưu trong mảng một chiều:
# ô (x, y) có chỉ số x * W + y, nên một nước đi của mã chỉ là cộng một hằng số, không cần kiểm tra biên.
W = n + 4
dist = [-2] * (W * W)
for x in range(2, n + 2):
    dist[x * W + 2:x * W + n + 2] = [-1] * n   # -1: ô trong bàn, chưa thăm
moves = (2 * W + 1, 2 * W - 1, -2 * W + 1, -2 * W - 1, W + 2, W - 2, -W + 2, -W - 2)
start, goal = (x1 + 1) * W + y1 + 1, (x2 + 1) * W + y2 + 1
dist[start] = 0
queue = [start]
for u in queue:                                 # BFS: duyệt list trong khi nối thêm vào cuối
    if u == goal:                               # lần đầu tới đích là ngắn nhất
        break
    d = dist[u] + 1
    for m in moves:
        v = u + m
        if dist[v] == -1:
            dist[v] = d
            queue.append(v)
print(dist[goal])
