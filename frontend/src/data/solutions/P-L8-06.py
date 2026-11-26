import sys


def sort_count(a):
    """Trả về (a đã sắp, số cặp i < j với a[i] > 2·a[j])."""
    if len(a) <= 1:
        return a, 0
    mid = len(a) // 2
    left, x = sort_count(a[:mid])
    right, y = sort_count(a[mid:])
    count = x + y
    # Hai nửa đã sắp: với mỗi phần tử bên trái, các phần tử bên phải thỏa điều kiện là một tiền tố chỉ dài ra.
    j = 0
    for v in left:
        while j < len(right) and v > 2 * right[j]:
            j += 1
        count += j
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    return merged + left[i:] + right[j:], count


data = sys.stdin.read().split()
n = int(data[0])
print(sort_count(list(map(int, data[1:1 + n])))[1])
