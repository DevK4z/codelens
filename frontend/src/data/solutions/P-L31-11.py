import sys

data = list(map(int, sys.stdin.read().split()))
n, M = data[0], data[1]
w = [0] + data[2:2 + 2 * n:2]
v = [0] + data[3:3 + 2 * n:2]
# f[i][j] = giá trị lớn nhất khi chỉ dùng vật 1..i và khối lượng không vượt j.
# Cần giữ đủ bảng để truy vết ngược.
f = [[0] * (M + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    prev, cur = f[i - 1], f[i]
    for j in range(M + 1):
        cur[j] = prev[j]
        if j >= w[i] and prev[j - w[i]] + v[i] > cur[j]:
            cur[j] = prev[j - w[i]] + v[i]
# Truy vết từ vật n về 1: chỉ chọn vật i khi bỏ nó thì giá trị giảm (f[i][j] != f[i-1][j]).
chosen = []
j = M
for i in range(n, 0, -1):
    if f[i][j] != f[i - 1][j]:
        chosen.append(i)
        j -= w[i]
chosen.reverse()
print(f[n][M])
print(len(chosen))
print(' '.join(map(str, chosen)))
