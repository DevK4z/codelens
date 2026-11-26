import sys

data = sys.stdin.read().split()
n = int(data[0])
seg = [(int(data[1 + 2 * i]), int(data[2 + 2 * i])) for i in range(n)]
seg.sort(key=lambda s: s[1])          # theo đầu phải tăng dần
points = 0
last = None                           # vị trí điểm vừa đóng
for l, r in seg:
    if last is None or l > last:      # đoạn này chưa chứa điểm nào
        last = r
        points += 1
print(points)
