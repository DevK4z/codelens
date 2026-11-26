import sys

data = sys.stdin.read().split()
n = int(data[0])
take = 0   # tổng lớn nhất của tiền tố, có chọn phần tử cuối
skip = 0   # tổng lớn nhất của tiền tố, không chọn phần tử cuối
for x in map(int, data[1:1 + n]):
    # chọn x thì phần tử trước không được chọn; bỏ x thì phần tử trước tùy ý
    take, skip = skip + x, max(take, skip)
print(max(take, skip))
