import sys

n = int(sys.stdin.readline())
prev = cur = 1                        # F(1) = F(2) = 1
for _ in range(3, n + 1):
    prev, cur = cur, prev + cur
print(cur)
