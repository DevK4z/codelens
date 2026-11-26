import sys
from collections import Counter

data = sys.stdin.read().split()
n = int(data[0])
freq = Counter(map(int, data[1:1 + n]))
# Nhiều lần nhất; bằng nhau thì giá trị nhỏ hơn.
best, count = min(freq.items(), key=lambda kv: (-kv[1], kv[0]))
print(best, count)
