import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
price = [0] + data[1:1 + n]
# best[length]: tiền lớn nhất khi bán một thanh dài length. Đoạn đầu dài k, phần còn lại tối ưu.
best = [0] * (n + 1)
for length in range(1, n + 1):
    best[length] = max(price[k] + best[length - k] for k in range(1, length + 1))
print(best[n])
