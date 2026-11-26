import sys

data = sys.stdin.read().split()
n = int(data[0])
count = [0] * 101                     # count[v] = số lần điểm v xuất hiện
for v in data[1:1 + n]:
    count[int(v)] += 1
out = []
for v in range(101):
    out += [v] * count[v]
print(' '.join(map(str, out)))
