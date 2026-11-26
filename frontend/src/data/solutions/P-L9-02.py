import sys

n = int(sys.stdin.readline())
lo, hi = 0, 1_000_000_000             # đáp án luôn nằm trong [lo, hi]
while lo < hi:
    mid = (lo + hi + 1) // 2          # làm tròn lên để vòng lặp luôn thu hẹp
    if mid * mid <= n:
        lo = mid
    else:
        hi = mid - 1
print(lo)
