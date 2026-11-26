import sys

X, Y = sys.stdin.read().split()
n, m = len(X), len(Y)
# L[i][j] = độ dài xâu con chung dài nhất của X[i:] và Y[j:].
L = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(n - 1, -1, -1):
    for j in range(m - 1, -1, -1):
        L[i][j] = L[i + 1][j + 1] + 1 if X[i] == Y[j] else max(L[i + 1][j], L[i][j + 1])
if L[0][0] == 0:
    print(0)
else:
    Z = []
    i = j = 0
    for need in range(L[0][0], 0, -1):
        for d in '987654321':         # thử chữ số lớn nhất trước để được số lớn nhất
            a, b = X.find(d, i), Y.find(d, j)
            if a == -1 or b == -1 or L[a][b] < need:
                continue
            Z.append(d)
            i, j = a + 1, b + 1
            break
    print(''.join(Z))
