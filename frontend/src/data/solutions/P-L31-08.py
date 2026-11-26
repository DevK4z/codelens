import sys

data = sys.stdin.read().split()
m, n = int(data[0]), int(data[1])
prev = [0] * (n + 1)                  # f của hàng trước (cột lệch 1 để khỏi xét biên)
best = 0
for row in data[2:2 + m]:
    cur = [0] * (n + 1)
    for j in range(1, n + 1):
        if row[j - 1] == '1':
            cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])
            best = max(best, cur[j])
    prev = cur
print(best)
