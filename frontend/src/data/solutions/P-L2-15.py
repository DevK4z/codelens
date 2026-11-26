import sys


def power(a, n):
    if n == 0:
        return 1
    half = power(a, n // 2)           # chỉ một lời gọi đệ quy: O(log n)
    return half * half * a if n % 2 else half * half


a, n = map(int, sys.stdin.read().split())
print(power(a, n))
