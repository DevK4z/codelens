import sys


def merge_two(a, b):
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    return out + a[i:] + b[j:]


def merge_range(lists, lo, hi):
    """Trộn các dãy lists[lo..hi] bằng chia để trị."""
    if lo == hi:
        return lists[lo]
    mid = (lo + hi) // 2
    return merge_two(merge_range(lists, lo, mid), merge_range(lists, mid + 1, hi))


data = list(map(int, sys.stdin.read().split()))
k = data[0]
lists, pos = [], 1
for _ in range(k):
    m = data[pos]
    lists.append(data[pos + 1:pos + 1 + m])
    pos += 1 + m
print(' '.join(map(str, merge_range(lists, 0, k - 1))))
