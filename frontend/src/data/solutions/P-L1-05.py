import sys

data = sys.stdin.read().split()
n, d = int(data[0]), int(data[1])
a = sorted(map(int, data[2:2 + n]))   # thứ tự không ảnh hưởng số cặp, nên được phép sắp xếp
pairs = left = 0
for right in range(n):
    while a[right] - a[left] > d:
        left += 1
    pairs += right - left             # a[left..right-1] đều chênh với a[right] không quá d
print(pairs)
