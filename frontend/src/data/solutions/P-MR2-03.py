import sys
import heapq

data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
heap = []   # max-heap kích thước k (heapq là min-heap nên lưu khóa đổi dấu)
for i in range(n):
    x, y = data[2 + 2 * i], data[3 + 2 * i]
    heapq.heappush(heap, (-(x * x + y * y), -x, -y))
    if len(heap) > k:
        heapq.heappop(heap)           # bỏ điểm "xa nhất" theo (khoảng cách², x, y)
best = sorted((-d, -x, -y) for d, x, y in heap)
print('\n'.join(f'{x} {y}' for _, x, y in best))
