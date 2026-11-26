import sys


def gcd_rec(a, b):
    if b == 0:
        return a
    return gcd_rec(b, a % b)          # Euclid: gcd(a, b) = gcd(b, a mod b)


a, b = map(int, sys.stdin.read().split())
print(gcd_rec(a, b))
