import sys
import heapq

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
a = map(int, data[2:2 + n])
# Giữ min-heap k phần tử lớn nhất: đỉnh heap chính là phần tử lớn thứ k. O(n log k).
heap = []
for x in a:
    if len(heap) < k:
        heapq.heappush(heap, x)
    elif x > heap[0]:
        heapq.heapreplace(heap, x)
print(heap[0])
