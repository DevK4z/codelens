import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
answer = [0] * n


def sort_count(idx):
    """Sắp danh sách chỉ số theo a, cộng vào answer số phần tử nhỏ hơn ở bên phải."""
    if len(idx) <= 1:
        return idx
    mid = len(idx) // 2
    left, right = sort_count(idx[:mid]), sort_count(idx[mid:])
    merged, i, j = [], 0, 0
    while i < len(left):
        if j == len(right) or a[left[i]] <= a[right[j]]:
            answer[left[i]] += j      # j phần tử bên phải đã ra trước đều nhỏ hơn
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    return merged + right[j:]


sort_count(list(range(n)))
print(' '.join(map(str, answer)))
