import sys
import heapq

data = list(map(int, sys.stdin.read().split()))
n = data[0]
low = []    # nửa nhỏ: max-heap (lưu số đổi dấu)
high = []   # nửa lớn: min-heap
out = []
for x in data[1:1 + n]:
    if not low or x <= -low[0]:
        heapq.heappush(low, -x)
    else:
        heapq.heappush(high, x)
    # Cân bằng: low có bằng hoặc hơn high đúng một phần tử.
    if len(low) > len(high) + 1:
        heapq.heappush(high, -heapq.heappop(low))
    elif len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))
    out.append(-low[0])               # trung vị (phần tử giữa nhỏ hơn) là đỉnh low
print(' '.join(map(str, out)))
