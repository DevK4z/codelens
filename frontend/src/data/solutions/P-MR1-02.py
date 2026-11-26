import sys

s = sys.stdin.readline().strip()
out = []
i = 0
while i < len(s):
    j = i
    while j < len(s) and s[j] == s[i]:   # s[i:j] là một loạt
        j += 1
    out.append(s[i] + (str(j - i) if j - i > 1 else ''))
    i = j
print(''.join(out))
