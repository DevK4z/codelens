import sys

data = sys.stdin.read().split()
n, m = int(data[0]), int(data[1])
grid = data[2:2 + n]
MOD = 1_000_000_007
# ways[j] của hàng hiện tại = số đường tới ô (i, j); ô (i, j) chỉ nhận từ trên và từ trái.
ways = [0] * m
for i in range(n):
    for j in range(m):
        if grid[i][j] == '#':
            ways[j] = 0
        elif i == 0 and j == 0:
            ways[j] = 1
        else:
            # ways[j] cũ là hàng i - 1 (từ trên), ways[j - 1] đã là hàng i (từ trái)
            ways[j] = (ways[j] + (ways[j - 1] if j > 0 else 0)) % MOD
print(ways[m - 1])
