import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
m = data[1 + n]
b = data[2 + n:2 + n + m]
union, inter = [], []
i = j = 0
while i < n and j < m:                # trộn hai dãy đã sắp như trong Merge Sort
    if a[i] < b[j]:
        union.append(a[i])
        i += 1
    elif a[i] > b[j]:
        union.append(b[j])
        j += 1
    else:
        union.append(a[i])
        inter.append(a[i])
        i += 1
        j += 1
union += a[i:] + b[j:]
print(' '.join(map(str, union)))
print(' '.join(map(str, inter)) if inter else 'NONE')
