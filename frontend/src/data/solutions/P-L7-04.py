import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
# Chẵn trước lẻ; chẵn tăng dần, lẻ giảm dần (đổi dấu để giảm dần).
a.sort(key=lambda x: (0, x) if x % 2 == 0 else (1, -x))
print(' '.join(map(str, a)))
