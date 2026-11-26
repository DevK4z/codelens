import sys


class Node:
    __slots__ = ('id', 'next')

    def __init__(self, id_):
        self.id = id_
        self.next = None


n, k = map(int, sys.stdin.read().split())
first = prev = Node(1)
for i in range(2, n + 1):
    prev.next = Node(i)
    prev = prev.next
prev.next = first                     # khép vòng; prev đứng trước người đếm "1"
for alive in range(n, 1, -1):
    for _ in range((k - 1) % alive):  # chỉ cần đi (k − 1) mod số người còn lại
        prev = prev.next
    prev.next = prev.next.next        # nối qua người bị loại; đếm tiếp từ người ngay sau
print(prev.id)
