import sys

data = sys.stdin.read().split()
n, S = int(data[0]), int(data[1])
coins = list(map(int, data[2:2 + n]))
INF = float('inf')
dp = [0] + [INF] * S              # dp[x]: số đồng ít nhất để đổi đúng x
for x in range(1, S + 1):
    best = INF
    for c in coins:
        if c <= x and dp[x - c] + 1 < best:
            best = dp[x - c] + 1
    dp[x] = best
print(-1 if dp[S] == INF else dp[S])
