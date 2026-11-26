import sys


def power(a, b, m):
    if b == 0:
        return 1 % m                   # 1 % m để đúng cả khi m = 1
    half = power(a, b // 2, m)
    result = half * half % m
    if b % 2 == 1:
        result = result * (a % m) % m
    return result


a, b, m = map(int, sys.stdin.read().split())
print(power(a, b, m))   # Python có sẵn pow(a, b, m), ở đây tự viết để luyện đệ quy
