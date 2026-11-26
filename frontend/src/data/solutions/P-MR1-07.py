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


s = sys.stdin.readline().strip()
print(len(s) - prefix_function(s)[-1])   # border dài nhất <-> chu kỳ nhỏ nhất
