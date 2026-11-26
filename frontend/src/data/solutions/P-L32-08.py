import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
jumps = cur_end = farthest = 0        # cur_end: ô xa nhất tới được với `jumps` bước
for i in range(n - 1):
    if i > cur_end:                   # không tới được ô i
        break
    farthest = max(farthest, i + a[i])
    if i == cur_end:                  # hết tầng hiện tại: phải nhảy thêm
        if farthest <= cur_end:       # không tiến thêm được
            break
        jumps += 1
        cur_end = farthest
print(jumps if cur_end >= n - 1 else -1)
