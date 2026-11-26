import sys

a, b = sys.stdin.read().split()
# Python có số nguyên lớn sẵn (int(a) * int(b)), nhưng ở đây nhân tay để luyện thuật toán.
x = [int(c) for c in reversed(a)]     # chữ số hàng đơn vị đứng đầu
y = [int(c) for c in reversed(b)]
res = [0] * (len(x) + len(y))         # res[k]: hàng 10^k, chưa xử lý nhớ
for i, dx in enumerate(x):
    for j, dy in enumerate(y):
        res[i + j] += dx * dy
for k in range(len(res) - 1):         # đẩy phần nhớ lên hàng trên
    res[k + 1] += res[k] // 10
    res[k] %= 10
while len(res) > 1 and res[-1] == 0:  # bỏ số 0 thừa, giữ ít nhất một chữ số
    res.pop()
print(''.join(map(str, reversed(res))))
