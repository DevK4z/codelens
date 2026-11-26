import sys

data = sys.stdin.read().split()
n = int(data[0])
# Khóa sắp xếp (độ dài, từ): ngắn hơn đứng trước, cùng độ dài thì theo từ điển.
print('\n'.join(sorted(data[1:1 + n], key=lambda w: (len(w), w))))
