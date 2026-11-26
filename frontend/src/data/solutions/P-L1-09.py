import sys
from math import isqrt                # căn bậc hai nguyên chính xác, không sai số như sqrt số thực

data = list(map(int, sys.stdin.buffer.read().split()))
t = data[0]
out = []
for i in range(t):
    l, r = data[1 + 2 * i], data[2 + 2 * i]
    out.append(isqrt(r) - isqrt(l - 1))   # số chính phương <= x có đúng isqrt(x) số
print('\n'.join(map(str, out)))
