import sys
from collections import deque

data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
dq = deque()                          # chỉ số trong cửa sổ, giá trị giảm dần từ đầu tới cuối
out = []
for i, x in enumerate(a):
    if dq and dq[0] <= i - k:         # chỉ số đã rời cửa sổ
        dq.popleft()
    while dq and a[dq[-1]] <= x:      # không bao giờ còn là max
        dq.pop()
    dq.append(i)
    if i >= k - 1:
        out.append(a[dq[0]])
print(' '.join(map(str, out)))
