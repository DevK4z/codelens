import sys

a, b = sys.stdin.read().split()
m = len(b)
# prev[j] = LCS(a[:i], b[:j]); hàng mới chỉ cần hàng trước nên giữ hai hàng.
prev = [0] * (m + 1)
for x in a:
    cur = [0] * (m + 1)
    for j in range(1, m + 1):
        cur[j] = prev[j - 1] + 1 if x == b[j - 1] else max(prev[j], cur[j - 1])
    prev = cur
print(prev[m])
