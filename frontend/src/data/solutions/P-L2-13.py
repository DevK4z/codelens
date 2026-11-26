import sys
from functools import lru_cache


@lru_cache(maxsize=None)              # nhớ kết quả: mỗi fib(k) chỉ tính một lần
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(fib(int(sys.stdin.readline())))
