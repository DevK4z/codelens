import sys

n = int(sys.stdin.readline())
parts = []
out = []


def gen(left, min_part):
    """Các số hạng không giảm để không liệt kê trùng một cách phân tích."""
    if left == 0:
        out.append('+'.join(map(str, parts)))
        return
    for x in range(min_part, left + 1):
        parts.append(x)
        gen(left - x, x)
        parts.pop()


gen(n, 1)
sys.stdout.write('\n'.join(out) + '\n')
