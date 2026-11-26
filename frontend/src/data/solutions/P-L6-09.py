import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
key = [0] * (n + 1)
L = [0] * (n + 1)
R = [0] * (n + 1)
for i in range(1, n + 1):
    key[i], L[i], R[i] = data[3 * i - 2:3 * i + 1]

out = []
level, depth = [1], 0
while level:                          # duyệt theo từng mức
    row = [key[v] for v in level]
    if depth % 2 == 1:
        row.reverse()
    out.append(' '.join(map(str, row)))
    level = [c for v in level for c in (L[v], R[v]) if c]
    depth += 1
print('\n'.join(out))
