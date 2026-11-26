import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
g = [data[1 + i * n:1 + (i + 1) * n] for i in range(n)]
seen = [[False] * n for _ in range(n)]
sys.setrecursionlimit(10000)


def dfs(r, c):
    if (r, c) == (n - 1, n - 1):
        return True
    seen[r][c] = True
    for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
        if 0 <= nr < n and 0 <= nc < n and not g[nr][nc] and not seen[nr][nc] and dfs(nr, nc):
            return True
    return False


print('YES' if g[0][0] == 0 and g[n - 1][n - 1] == 0 and dfs(0, 0) else 'NO')
