import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
p = data[1:2 + n]                     # ma trận i có kích thước p[i−1] × p[i]
cost = [[0] * (n + 1) for _ in range(n + 1)]
for length in range(2, n + 1):        # đoạn ngắn trước để đoạn con đã có kết quả
    for i in range(1, n - length + 2):
        j = i + length - 1
        cost[i][j] = min(cost[i][k] + cost[k + 1][j] + p[i - 1] * p[k] * p[j] for k in range(i, j))
print(cost[1][n])
