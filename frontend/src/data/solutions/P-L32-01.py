import sys

data = sys.stdin.read().split()
n = int(data[0])
t = sorted(map(int, data[1:1 + n]))   # người phục vụ nhanh đi trước
total_wait = elapsed = 0
for x in t:
    total_wait += elapsed             # người này chờ hết thời gian của những người trước
    elapsed += x
print(total_wait)
