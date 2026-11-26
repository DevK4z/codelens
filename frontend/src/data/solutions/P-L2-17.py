import sys

n = int(sys.stdin.readline())
out = [str(2 ** n - 1)]


def hanoi(k, src, via, dst):
    if k == 0:
        return
    hanoi(k - 1, src, dst, via)       # dọn k − 1 đĩa sang cọc trung gian
    out.append(f'{src} {dst}')        # chuyển đĩa lớn nhất
    hanoi(k - 1, via, src, dst)       # đặt k − 1 đĩa lên trên nó


hanoi(n, 'A', 'B', 'C')
sys.stdout.write('\n'.join(out) + '\n')
