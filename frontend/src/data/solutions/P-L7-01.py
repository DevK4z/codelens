import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
swaps = 0
for i in range(n):
    min_index = i
    for j in range(i + 1, n):
        if a[j] < a[min_index]:       # "<": giữ vị trí nhỏ nhất khi bằng nhau
            min_index = j
    if min_index != i:
        a[i], a[min_index] = a[min_index], a[i]
        swaps += 1
print(swaps)
print(' '.join(map(str, a)))
