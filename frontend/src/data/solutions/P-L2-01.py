import sys

n = int(sys.stdin.readline())
cur = []
out = []


def generate(pos):
    if pos == n:
        out.append(''.join(cur))
        return
    cur.append('0')
    generate(pos + 1)
    cur.pop()
    if pos == 0 or cur[pos - 1] == '0':   # không đặt hai số 1 liền nhau
        cur.append('1')
        generate(pos + 1)
        cur.pop()


generate(0)
sys.stdout.write('\n'.join(out) + '\n')
