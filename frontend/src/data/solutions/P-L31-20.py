import sys
from bisect import bisect_right

data = list(map(int, sys.stdin.read().split()))
n = data[0]
g = sorted(zip(data[1:1 + 2 * n:2], data[2:2 + 2 * n:2]))
tails = []                            # tails[L − 1] = y cuối nhỏ nhất của dãy không giảm độ dài L
for _, y in g:
    i = bisect_right(tails, y)        # bisect_right: cho phép y bằng nhau (không giảm)
    if i == len(tails):
        tails.append(y)
    else:
        tails[i] = y
print(len(tails))
