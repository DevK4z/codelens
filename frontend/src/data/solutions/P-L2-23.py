import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
total = sum(a)


def dfs(i, s, target):
    """Có chọn được tập con của a[i:] để tổng hiện tại s thành đúng target không?"""
    if s > target:                    # vượt nửa tổng: dừng nhánh
        return False
    if i == n:
        return s == target
    return dfs(i + 1, s + a[i], target) or dfs(i + 1, s, target)   # "or" dừng ngay khi tìm thấy


# Tổng lẻ thì chắc chắn không chia được.
print('YES' if total % 2 == 0 and dfs(0, 0, total // 2) else 'NO')
