import sys

a, b = sys.stdin.read().split()
n, m = len(a), len(b)
prev = list(range(m + 1))         # biến xâu rỗng thành b[:j]: chèn j ký tự
for i in range(1, n + 1):
    cur = [i] + [0] * m           # xóa i ký tự
    for j in range(1, m + 1):
        if a[i - 1] == b[j - 1]:
            cur[j] = prev[j - 1]
        else:
            cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])   # xóa, chèn, thay
    prev = cur
print(prev[m])
