import sys

n = int(sys.stdin.readline())
count = 0
d = 1
while d * d <= n:
    if n % d == 0:
        count += 1 if d * d == n else 2   # d và n/d; nếu trùng nhau thì chỉ tính một
    d += 1
print(count)
