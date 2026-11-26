import sys


def sort_count(a):
    """Trả về (a đã sắp, số cặp nghịch thế trong a)."""
    if len(a) <= 1:
        return a, 0
    mid = len(a) // 2
    left, x = sort_count(a[:mid])
    right, y = sort_count(a[mid:])
    merged, count = [], x + y
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            count += len(left) - i    # right[j] nhỏ hơn mọi left[i:]
            merged.append(right[j])
            j += 1
    merged += left[i:]
    merged += right[j:]
    return merged, count


data = sys.stdin.read().split()
n = int(data[0])
print(sort_count(list(map(int, data[1:1 + n])))[1])
