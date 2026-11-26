import sys

sys.setrecursionlimit(1 << 16)
s = sys.stdin.readline().rstrip('\r\n')   # đọc cả dòng (có thể có dấu cách), bỏ ký tự xuống dòng
out = []


def print_reversed(i):
    if i < 0:
        return
    out.append(s[i])                  # in ký tự cuối trước, rồi đảo phần còn lại
    print_reversed(i - 1)


print_reversed(len(s) - 1)
print(''.join(out))
