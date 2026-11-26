import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, m, q = data[0], data[1], data[2]
# P[i][j] = tổng hình chữ nhật từ (1, 1) tới (i, j); thêm hàng/cột 0 để khỏi xét biên.
P = [[0] * (m + 1) for _ in range(n + 1)]
pos = 3
for i in range(1, n + 1):
    row, above = P[i], P[i - 1]
    for j in range(1, m + 1):
        row[j] = data[pos] + above[j] + row[j - 1] - above[j - 1]
        pos += 1
out = []
for _ in range(q):
    x1, y1, x2, y2 = data[pos:pos + 4]
    pos += 4
    # Bao hàm – loại trừ: bỏ dải phía trên và dải bên trái, cộng lại góc bị trừ hai lần.
    out.append(P[x2][y2] - P[x1 - 1][y2] - P[x2][y1 - 1] + P[x1 - 1][y1 - 1])
print('\n'.join(map(str, out)))
