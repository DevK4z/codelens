import sys

data = list(map(int, sys.stdin.read().split()))
n, target = data[0], data[1]
a = data[2:2 + n]


def count_ways(i, total):
    """Số cách đặt dấu cho a[i:] để tổng cuối cùng bằng target, biết tổng hiện tại là total."""
    if i == n:
        return 1 if total == target else 0
    return count_ways(i + 1, total + a[i]) + count_ways(i + 1, total - a[i])


print(count_ways(0, 0))
