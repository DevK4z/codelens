import sys

n, r, c = map(int, sys.stdin.read().split())
MOVES = ((2, 1), (1, 2), (-1, 2), (-2, 1), (-2, -1), (-1, -2), (1, -2), (2, -1))
seen = [[False] * n for _ in range(n)]


def tour(x, y, k):
    """Đã đi qua k ô, đang đứng ở (x, y): có đi tiếp hết bàn cờ được không?"""
    if k == n * n:
        return True
    for dx, dy in MOVES:
        a, b = x + dx, y + dy
        if 0 <= a < n and 0 <= b < n and not seen[a][b]:
            seen[a][b] = True
            if tour(a, b, k + 1):
                return True
            seen[a][b] = False        # quay lui
    return False


# Bàn lẻ: mã luôn đổi màu ô, nên phải xuất phát từ ô cùng màu với góc (r + c chẵn).
possible = not (n % 2 == 1 and (r + c) % 2 == 1)
seen[r - 1][c - 1] = True
print('YES' if possible and tour(r - 1, c - 1, 1) else 'NO')
