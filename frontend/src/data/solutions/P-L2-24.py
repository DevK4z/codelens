import sys

n = int(sys.stdin.readline())
col = [False] * n
diag1 = [False] * (2 * n)             # r + c
diag2 = [False] * (2 * n)             # r − c + n − 1


def place(r):
    if r == n:
        return 1
    ways = 0
    for c in range(n):
        if col[c] or diag1[r + c] or diag2[r - c + n - 1]:
            continue
        col[c] = diag1[r + c] = diag2[r - c + n - 1] = True
        ways += place(r + 1)
        col[c] = diag1[r + c] = diag2[r - c + n - 1] = False
    return ways


print(place(0))
