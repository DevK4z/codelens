import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = sorted(data[1:1 + n])
b = sorted(data[1 + n:1 + 2 * n])
# người thấp thứ i ghép với người thấp thứ i
print(sum(abs(x - y) for x, y in zip(a, b)))
