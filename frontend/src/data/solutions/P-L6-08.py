import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
key = [0] * (n + 1)
L = [0] * (n + 1)
R = [0] * (n + 1)
for i in range(1, n + 1):
    key[i], L[i], R[i] = data[3 * i - 2:3 * i + 1]

# Mỗi cặp (a, b) cần là ảnh gương của nhau. Dùng stack thay cho đệ quy (cây có thể rất sâu).
stack = [(L[1], R[1])]
ok = True
while stack:
    a, b = stack.pop()
    if a == 0 and b == 0:
        continue
    if a == 0 or b == 0 or key[a] != key[b]:
        ok = False
        break
    stack.append((L[a], R[b]))        # ngoài với ngoài
    stack.append((R[a], L[b]))        # trong với trong
print('YES' if ok else 'NO')
