import sys

n = int(sys.stdin.readline())
perm = []
used = [False] * (n + 1)
out = []


def gen():
    if len(perm) == n:
        out.append(' '.join(map(str, perm)))
        return
    for x in range(1, n + 1):
        if not used[x]:
            used[x] = True
            perm.append(x)
            gen()
            perm.pop()
            used[x] = False           # trả lại để nhánh khác dùng


gen()
sys.stdout.write('\n'.join(out) + '\n')
