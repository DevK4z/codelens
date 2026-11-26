import sys

n = int(sys.stdin.readline())
before = here = 1                     # ways(i − 1), ways(i) với i = 1
for _ in range(2, n + 1):
    before, here = here, before + here
print(here)
