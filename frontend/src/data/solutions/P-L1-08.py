import sys


def gcd(a, b):
    while b:                          # Euclid: gcd(a, b) = gcd(b, a % b)
        a, b = b, a % b
    return a


data = list(map(int, sys.stdin.buffer.read().split()))
t = data[0]
out = []
for i in range(t):
    a, b = data[1 + 2 * i], data[2 + 2 * i]
    g = gcd(a, b)
    out.append(f'{g} {a // g * b}')   # Python không tràn số, nhưng chia trước vẫn là thói quen tốt
print('\n'.join(out))
