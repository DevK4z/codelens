import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
# Bất biến: a[:low] = 0, a[low:mid] = 1, a[mid..high] chưa xét, a[high+1:] = 2.
low = mid = 0
high = n - 1
while mid <= high:
    if a[mid] == 0:
        a[low], a[mid] = a[mid], a[low]
        low += 1
        mid += 1
    elif a[mid] == 1:
        mid += 1
    else:
        a[mid], a[high] = a[high], a[mid]   # chưa tăng mid: phần tử vừa đổi về chưa được xét
        high -= 1
print(' '.join(map(str, a)))
