import sys
from collections import deque

data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
p = data[2:2 + n]
cnt = [0] * 10                        # số tài liệu còn trong hàng theo độ ưu tiên
for x in p:
    cnt[x] += 1
q = deque(range(n))
printed = 0
while True:
    j = q.popleft()
    if any(cnt[v] for v in range(p[j] + 1, 10)):
        q.append(j)                   # còn tài liệu quan trọng hơn: xuống cuối hàng
    else:
        printed += 1
        cnt[p[j]] -= 1
        if j == m - 1:
            break
print(printed)
