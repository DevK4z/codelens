import sys


def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i][1] >= right[j][1]:   # ">=": bằng điểm thì giữ thứ tự cũ (ổn định)
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    return out + left[i:] + right[j:]


data = sys.stdin.read().split()
n = int(data[0])
students = [(data[1 + 2 * i], int(data[2 + 2 * i])) for i in range(n)]
print('\n'.join(f'{name} {score}' for name, score in merge_sort(students)))
