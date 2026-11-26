import sys

n = int(sys.stdin.readline())
cur = []
out = []


def generate(opened, closed):
    if len(cur) == 2 * n:
        out.append(''.join(cur))
        return
    if opened < n:
        cur.append('(')
        generate(opened + 1, closed)
        cur.pop()
    if closed < opened:                # chỉ đóng khi có ngoặc mở đang chờ
        cur.append(')')
        generate(opened, closed + 1)
        cur.pop()


generate(0, 0)
sys.stdout.write('\n'.join(out) + '\n')
