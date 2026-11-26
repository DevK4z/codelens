import sys

def prefix_function(p):
    """pi[i]: độ dài tiền tố dài nhất của p cũng là hậu tố của p[0..i] (không tính chính nó)."""
    pi = [0] * len(p)
    k = 0
    for i in range(1, len(p)):
        while k > 0 and p[i] != p[k]:
            k = pi[k - 1]
        if p[i] == p[k]:
            k += 1
        pi[i] = k
    return pi


s, p = sys.stdin.read().split()
m = len(p)
pi = prefix_function(p)
pos = []
k = 0
for i, c in enumerate(s):
    while k > 0 and c != p[k]:        # không khớp: lùi theo pi, không lùi i
        k = pi[k - 1]
    if c == p[k]:
        k += 1
    if k == m:
        pos.append(i - m + 2)         # vị trí bắt đầu, đánh số từ 1
        k = pi[k - 1]                 # tìm tiếp lần xuất hiện chồng lên
print(len(pos))
if pos:
    print(' '.join(map(str, pos)))
