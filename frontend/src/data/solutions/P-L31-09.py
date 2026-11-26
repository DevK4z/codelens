import sys

s = sys.stdin.readline().strip()
n = len(s)
# below[j] = f[i+1][j], here[j] = f[i][j]: số ký tự cần chèn cho đoạn s[i..j].
below = [0] * n
for i in range(n - 1, -1, -1):
    here = [0] * n                    # here[i] = 0: một ký tự đã đối xứng
    for j in range(i + 1, n):
        if s[i] == s[j]:
            here[j] = below[j - 1] if i + 1 <= j - 1 else 0
        else:
            here[j] = 1 + min(below[j], here[j - 1])
    below = here
print(below[n - 1])
