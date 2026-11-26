import sys

data = sys.stdin.read().split()
n = int(data[0])
a = list(map(int, data[1:1 + n]))
answer = [-1] * n
waiting = []                  # stack các chỉ số chưa có phần tử lớn hơn bên phải
for i, x in enumerate(a):
    while waiting and a[waiting[-1]] < x:
        answer[waiting.pop()] = x
    waiting.append(i)
print(' '.join(map(str, answer)))
