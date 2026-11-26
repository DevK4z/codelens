import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
pivot = a[-1]
i = -1                                # a[0..i] là các phần tử <= pivot
for j in range(n - 1):
    if a[j] <= pivot:
        i += 1
        a[i], a[j] = a[j], a[i]
a[i + 1], a[-1] = a[-1], a[i + 1]     # pivot về đúng chỗ
print(' '.join(map(str, a)))
print(i + 1)
