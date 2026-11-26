import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
rows, pos = [], 1
for i in range(n):
    rows.append(data[pos:pos + i + 1])
    pos += i + 1
best = rows[-1][:]                    # tổng lớn nhất từ hàng cuối xuống đáy
for i in range(n - 2, -1, -1):
    best = [rows[i][j] + max(best[j], best[j + 1]) for j in range(i + 1)]
print(best[0])
