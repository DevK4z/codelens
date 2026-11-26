import sys


def solve(pts):
    """pts đã sắp theo x. Trả về (bình phương khoảng cách nhỏ nhất, pts sắp theo y)."""
    if len(pts) <= 1:
        return float('inf'), pts
    m = len(pts) // 2
    mid_x = pts[m][0]
    d1, left = solve(pts[:m])
    d2, right = solve(pts[m:])
    d = min(d1, d2)
    by_y, i, j = [], 0, 0             # trộn hai nửa theo y
    while i < len(left) and j < len(right):
        if left[i][1] <= right[j][1]:
            by_y.append(left[i])
            i += 1
        else:
            by_y.append(right[j])
            j += 1
    by_y += left[i:] + right[j:]
    strip = [p for p in by_y if (p[0] - mid_x) ** 2 < d]   # dải quanh đường chia, theo thứ tự y
    for a in range(len(strip)):
        for b in range(a + 1, len(strip)):
            dy = strip[b][1] - strip[a][1]
            if dy * dy >= d:
                break
            dx = strip[b][0] - strip[a][0]
            d = min(d, dx * dx + dy * dy)
    return d, by_y


data = list(map(int, sys.stdin.read().split()))
n = data[0]
pts = sorted(zip(data[1:1 + 2 * n:2], data[2:2 + 2 * n:2]))
print(solve(pts)[0])
