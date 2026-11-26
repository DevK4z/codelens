import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
g, c = data[1:1 + n], data[1 + n:1 + 2 * n]
total = tank = start = 0
for i in range(n):
    total += g[i] - c[i]
    tank += g[i] - c[i]
    if tank < 0:                      # không trạm nào trong [start, i] xuất phát được
        start = i + 1
        tank = 0
print(start + 1 if total >= 0 else -1)
