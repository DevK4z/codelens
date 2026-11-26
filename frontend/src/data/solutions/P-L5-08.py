import sys
from collections import deque

data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
max_q, min_q = deque(), deque()       # chỉ số; giá trị giảm dần / tăng dần
best = l = 0
for r, x in enumerate(a):
    while max_q and a[max_q[-1]] <= x:
        max_q.pop()
    max_q.append(r)
    while min_q and a[min_q[-1]] >= x:
        min_q.pop()
    min_q.append(r)
    while a[max_q[0]] - a[min_q[0]] > k:   # thu hẹp từ trái
        l += 1
        if max_q[0] < l:
            max_q.popleft()
        if min_q[0] < l:
            min_q.popleft()
    best = max(best, r - l + 1)
print(best)
