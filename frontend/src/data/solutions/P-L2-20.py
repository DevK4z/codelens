import sys

n, k = map(int, sys.stdin.read().split())
pick = []
out = []


def gen(start):
    if len(pick) == k:
        out.append(' '.join(map(str, pick)))
        return
    # Phần tử tiếp theo không vượt n − (số còn phải chọn) + 1, để còn đủ số lớn hơn phía sau.
    for x in range(start, n - (k - len(pick)) + 2):
        pick.append(x)
        gen(x + 1)
        pick.pop()


gen(1)
sys.stdout.write('\n'.join(out) + '\n')
