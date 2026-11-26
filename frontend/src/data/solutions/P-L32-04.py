import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
jobs = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]   # (thời gian t, hạn chót d)
jobs.sort(key=lambda j: j[1])         # hạn chót sớm làm trước
finish = worst = 0
for t, d in jobs:
    finish += t
    worst = max(worst, finish - d)    # độ trễ = max(0, f - d); worst bắt đầu từ 0
print(worst)
