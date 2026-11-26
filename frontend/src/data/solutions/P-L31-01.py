import sys

n = int(sys.stdin.readline())
MOD = 1_000_000_007
# f3 = f(i-3), f2 = f(i-2), f1 = f(i-1); f(0) = 1, f(âm) = 0.
f3, f2, f1 = 0, 0, 1
for _ in range(n):
    f3, f2, f1 = f2, f1, (f1 + f2 + f3) % MOD
print(f1)
