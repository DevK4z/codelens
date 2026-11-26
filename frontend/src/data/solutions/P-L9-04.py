import sys


def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[lo] <= a[mid]:                       # nửa trái a[lo..mid] được sắp đúng
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                     # nửa phải a[mid..hi] được sắp đúng
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1


data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
a = data[2:2 + n]
print('\n'.join(str(search(a, x)) for x in data[2 + n:2 + n + q]))
