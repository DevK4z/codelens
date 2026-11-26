import sys

data = list(map(int, sys.stdin.buffer.read().split()))
n, q = data[0], data[1]
a = data[2:2 + n]
diff = [0] * (n + 1)                  # diff[i]: lượng thay đổi bắt đầu từ vị trí i (đánh số từ 0)
pos = 2 + n
for _ in range(q):
    l, r, v = data[pos:pos + 3]
    pos += 3
    diff[l - 1] += v                  # từ l trở đi được cộng v
    diff[r] -= v                      # từ r + 1 trở đi hủy lượng cộng đó
add = 0
out = []
for i in range(n):
    add += diff[i]
    out.append(a[i] + add)
print(' '.join(map(str, out)))
