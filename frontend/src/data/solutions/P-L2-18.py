import sys

n = int(sys.stdin.readline())
cur = ['0'] * n
out = []


def gen(i):
    if i == n:
        out.append(''.join(cur))
        return
    for c in '01':
        cur[i] = c
        gen(i + 1)


gen(0)
sys.stdout.write('\n'.join(out) + '\n')
