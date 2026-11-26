import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
seen = {0: 1}                         # tổng tiền tố -> số lần đã gặp; tiền tố rỗng = 0
prefix = count = 0
for x in map(int, data[2:2 + n]):
    prefix += x
    count += seen.get(prefix - k, 0)  # mỗi tiền tố trước bằng prefix - k cho một đoạn tổng k
    seen[prefix] = seen.get(prefix, 0) + 1
print(count)
