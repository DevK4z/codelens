import sys

s = sys.stdin.readline().strip()
pair = {')': '(', ']': '[', '}': '{'}
stack = []
ok = True
for c in s:
    if c in '([{':
        stack.append(c)
    elif not stack or stack[-1] != pair[c]:   # đóng sai loại hoặc thừa
        ok = False
        break
    else:
        stack.pop()
print('YES' if ok and not stack else 'NO')   # còn ngoặc mở chưa đóng → sai
