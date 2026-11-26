import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
h = data[1:1 + n] + [0]               # thêm một cột cao 0 ở cuối để dọn hết stack
stack = []                            # chỉ số các cột có chiều cao tăng dần
best = 0
for i, cur in enumerate(h):
    while stack and h[stack[-1]] >= cur:
        height = h[stack.pop()]
        # Cột vừa lấy ra là cột thấp nhất của đoạn từ (đỉnh stack mới + 1) tới (i - 1).
        left = stack[-1] + 1 if stack else 0
        best = max(best, height * (i - left))
    stack.append(i)
print(best)
