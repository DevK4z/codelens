import sys
from bisect import bisect_left

data = list(map(int, sys.stdin.read().split()))
n = data[0]
tails = []                            # tails[L − 1] = phần tử cuối nhỏ nhất của dãy tăng độ dài L
for x in data[1:1 + n]:
    i = bisect_left(tails, x)
    if i == len(tails):
        tails.append(x)
    else:
        tails[i] = x
print(len(tails))
