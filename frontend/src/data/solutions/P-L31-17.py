import sys

data = list(map(int, sys.stdin.read().split()))
n, S = data[0], data[1]
can = [False] * (S + 1)               # can[t]: có tập con tổng đúng t
can[0] = True
for x in data[2:2 + n]:
    for t in range(S, x - 1, -1):     # duyệt giảm để mỗi số chỉ dùng một lần
        if can[t - x]:
            can[t] = True
print('YES' if can[S] else 'NO')
