import sys

data = sys.stdin.read().split()
n, K = int(data[0]), int(data[1])
seen = {}                             # giá trị -> số lần đã gặp bên trái
pairs = 0
for x in map(int, data[2:2 + n]):
    pairs += seen.get(K - x, 0)
    seen[x] = seen.get(x, 0) + 1
print(pairs)
