import sys
from collections import deque

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
grid = [list(row) for row in data[2:2 + n]]
islands = 0
for i in range(n):
    for j in range(m):
        if grid[i][j] != '1':
            continue
        islands += 1
        grid[i][j] = '0'                  # đánh dấu đã thăm ngay khi cho vào hàng đợi
        q = deque([(i, j)])
        while q:
            x, y = q.popleft()
            for u, v in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= u < n and 0 <= v < m and grid[u][v] == '1':
                    grid[u][v] = '0'
                    q.append((u, v))
print(islands)
