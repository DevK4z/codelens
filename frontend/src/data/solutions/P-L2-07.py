import sys

KEYS = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}
digits = sys.stdin.readline().strip()
cur = [''] * len(digits)
out = []


def backtrack(i):
    if i == len(digits):              # đã chọn đủ chữ cho mọi phím
        out.append(''.join(cur))
        return
    for c in KEYS[digits[i]]:
        cur[i] = c
        backtrack(i + 1)


backtrack(0)
sys.stdout.write('\n'.join(out) + '\n')
