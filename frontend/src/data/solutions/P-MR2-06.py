import sys
import heapq

data = list(map(int, sys.stdin.read().split()))
n = data[0]
procs = sorted((data[1 + 3 * i], data[2 + 3 * i], data[3 + 3 * i], i + 1) for i in range(n))  # (đến, chạy, ưu tiên, chỉ số)
ready = []                            # min-heap theo (ưu tiên, lúc đến, chỉ số)
time = total_wait = nxt = 0
order = []
while len(order) < n:
    while nxt < n and procs[nxt][0] <= time:
        arrive, dur, prio, pid = procs[nxt]
        heapq.heappush(ready, (prio, arrive, pid, dur))
        nxt += 1
    if not ready:                     # CPU chờ tới lần đến kế tiếp
        time = procs[nxt][0]
        continue
    prio, arrive, pid, dur = heapq.heappop(ready)
    total_wait += time - arrive
    time += dur
    order.append(pid)
print(' '.join(map(str, order)))
print(total_wait)
