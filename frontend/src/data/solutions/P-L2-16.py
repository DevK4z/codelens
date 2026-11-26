import sys
from functools import lru_cache


@lru_cache(maxsize=None)
def X(n):
    if n == 0:
        return 1
    return X(n - 1) + Y(n - 1)


@lru_cache(maxsize=None)
def Y(n):                             # Python tra tên lúc gọi nên X gọi được Y khai báo sau
    if n == 0:
        return 1
    return 2 * X(n - 1) + Y(n - 1)


n = int(sys.stdin.readline())
print(X(n), Y(n))
