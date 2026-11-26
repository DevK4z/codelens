import sys

sys.setrecursionlimit(1 << 16)


def sum_to(n):
    if n == 0:                        # điều kiện dừng
        return 0
    return n + sum_to(n - 1)


print(sum_to(int(sys.stdin.readline())))
