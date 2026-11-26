import sys

data = sys.stdin.buffer.read().split()
n, q = int(data[0]), int(data[1])
prefix = [0] * (n + 1)            # prefix[i] = a1 + ... + ai
for i in range(1, n + 1):
    prefix[i] = prefix[i - 1] + int(data[1 + i])
out = []
pos = 2 + n
for _ in range(q):
    l, r = int(data[pos]), int(data[pos + 1])
    pos += 2
    out.append(prefix[r] - prefix[l - 1])
print('\n'.join(map(str, out)))
