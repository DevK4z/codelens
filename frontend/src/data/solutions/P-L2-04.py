import sys


def gray(n):
    """Mã Gray phản xạ: G(n) = 0·G(n-1) nối với 1·đảo_ngược(G(n-1))."""
    if n == 1:
        return ['0', '1']
    prev = gray(n - 1)
    return ['0' + c for c in prev] + ['1' + c for c in reversed(prev)]


n = int(sys.stdin.readline())
sys.stdout.write('\n'.join(gray(n)) + '\n')
