import sys
import heapq

data = list(map(int, sys.stdin.read().split()))
n = data[0]
meetings = sorted(zip(data[1:1 + 2 * n:2], data[2:2 + 2 * n:2]))   # theo giờ bắt đầu
ends = []                             # min-heap giờ kết thúc của các phòng đã mở
for s, e in meetings:
    if ends and ends[0] <= s:
        heapq.heapreplace(ends, e)    # phòng trống sớm nhất dùng lại được
    else:
        heapq.heappush(ends, e)
print(len(ends))
