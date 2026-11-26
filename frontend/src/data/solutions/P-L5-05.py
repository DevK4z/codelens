import sys

path = sys.stdin.readline().strip()
stack = []                            # list dùng như ngăn xếp để in được từ đáy lên đỉnh
for part in path.split('/'):
    if part in ('', '.'):             # "//" hoặc thư mục hiện tại
        continue
    if part == '..':
        if stack:
            stack.pop()
    else:
        stack.append(part)            # kể cả "..." là tên thư mục bình thường
print('/' + '/'.join(stack))
