import sys

data = sys.stdin.read().split()
n = int(data[0])
take2 = take1 = 0                     # tốt nhất tới phần tử i − 2 và i − 1
for x in map(int, data[1:1 + n]):
    take2, take1 = take1, max(take1, take2 + x)   # bỏ x, hoặc lấy x cùng kết quả tới i − 2
print(take1)
