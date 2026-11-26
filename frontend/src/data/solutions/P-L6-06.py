import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
left = [0] * (n + 1)
right = [0] * (n + 1)
for i in range(1, n + 1):
    _, left[i], right[i] = data[3 * i - 2:3 * i + 1]

# Thứ tự BFS; duyệt ngược lại thì con luôn được xử lý trước cha (như hậu tự, không cần đệ quy).
order = [1]
for v in order:
    order += [c for c in (left[v], right[v]) if c]
height = [0] * (n + 1)                # số nút trên đường dài nhất từ v xuống lá; height[0] = 0
diameter = 0
for v in reversed(order):
    hl, hr = height[left[v]], height[right[v]]
    diameter = max(diameter, hl + hr) # đường đi gấp khúc tại v có hl + hr cạnh
    height[v] = 1 + max(hl, hr)
print(diameter)
