import sys


class Node:
    __slots__ = ('data', 'prev', 'next')

    def __init__(self, data, prev=None):
        self.data, self.prev, self.next = data, prev, None


data = sys.stdin.read().split()
n = int(data[0])
head = tail = None
for v in data[1:1 + n]:
    node = Node(int(v), tail)
    if tail:
        tail.next = node
    else:
        head = node
    tail = node
ok = True
left, right = head, tail              # hai con trỏ đi từ hai đầu vào giữa
for _ in range(n // 2):
    if left.data != right.data:
        ok = False
        break
    left, right = left.next, right.prev
print('YES' if ok else 'NO')
