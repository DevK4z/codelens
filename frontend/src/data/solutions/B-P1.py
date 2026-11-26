import sys

data = sys.stdin.read().split()
n = int(data[0])
best = None   # đoạn con phải khác rỗng nên không khởi tạo bằng 0
cur = 0       # tổng lớn nhất của đoạn kết thúc tại phần tử đang xét
for x in map(int, data[1:1 + n]):
    cur = max(x, cur + x)
    best = cur if best is None else max(best, cur)
print(best)
