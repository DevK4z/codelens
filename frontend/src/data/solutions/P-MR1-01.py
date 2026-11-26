import sys

line = sys.stdin.readline()
# split() không tham số tự bỏ mọi dấu cách thừa; capitalize(): hoa chữ đầu, thường phần còn lại.
print(' '.join(word.capitalize() for word in line.split()))
