import sys
import heapq

data = sys.stdin.read().split()
n = int(data[0])
ropes = list(map(int, data[1:1 + n]))
heapq.heapify(ropes)                  # hàng đợi ưu tiên lấy nhỏ nhất
cost = 0
while len(ropes) > 1:
    a = heapq.heappop(ropes)
    b = heapq.heappop(ropes)
    cost += a + b
    heapq.heappush(ropes, a + b)      # sợi mới quay lại hàng đợi
print(cost)
