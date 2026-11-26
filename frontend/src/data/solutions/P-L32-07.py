import sys

num, k = sys.stdin.read().split()
k = int(k)
# Giữ một "stack" chữ số tăng dần: gặp chữ số nhỏ hơn đỉnh thì xóa đỉnh (nếu còn lượt).
kept = []
for c in num:
    while k > 0 and kept and kept[-1] > c:
        kept.pop()
        k -= 1
    kept.append(c)
if k:
    del kept[-k:]                     # còn lượt xóa: bỏ ở cuối (các chữ số lớn nhất)
print(''.join(kept).lstrip('0') or '0')
