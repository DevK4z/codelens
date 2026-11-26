import sys

data = sys.stdin.read().split()
n = int(data[0])
a = sorted(map(int, data[1:1 + n]))
print(min(a[i] - a[i - 1] for i in range(1, n)))   # chỉ cần xét các cặp kề nhau
