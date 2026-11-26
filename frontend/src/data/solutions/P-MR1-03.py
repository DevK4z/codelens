import sys

words = sys.stdin.readline().split()  # tự bỏ dấu cách thừa ở đầu, cuối và giữa
print(' '.join(reversed(words)))
