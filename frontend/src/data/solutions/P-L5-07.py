import sys

s = sys.stdin.readline().strip()
stack = []                            # mỗi mức ngoặc đang mở: (phần xâu ở ngoài, số lần lặp)
cur = []
k = 0
for c in s:
    if c.isdigit():
        k = k * 10 + int(c)
    elif c == '[':
        stack.append((cur, k))
        cur, k = [], 0
    elif c == ']':
        outer, times = stack.pop()
        outer.append(''.join(cur) * times)
        cur = outer
    else:
        cur.append(c)
print(''.join(cur))
