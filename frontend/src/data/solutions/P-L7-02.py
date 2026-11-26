import sys
from collections import Counter

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
freq = Counter(a)
a.sort(key=lambda x: (-freq[x], x))   # tần suất giảm dần, bằng nhau thì giá trị tăng dần
print(' '.join(map(str, a)))
