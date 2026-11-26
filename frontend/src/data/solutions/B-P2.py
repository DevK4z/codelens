import sys
from bisect import bisect_left, bisect_right

data = sys.stdin.read().split()
n, q = int(data[0]), int(data[1])
a = list(map(int, data[2:2 + n]))
out = []
for x in map(int, data[2 + n:2 + n + q]):
    # bisect_left: vị trí đầu tiên >= x; bisect_right: vị trí đầu tiên > x
    out.append(bisect_right(a, x) - bisect_left(a, x))
print('\n'.join(map(str, out)))
