import sys


class Node:
    __slots__ = ('id', 'next')

    def __init__(self, id_):
        self.id = id_
        self.next = None


n, k = map(int, sys.stdin.read().split())
head = tail = Node(1)
for i in range(2, n + 1):
    tail.next = Node(i)
    tail = tail.next
tail.next = head                      # khép vòng
prev = tail                           # nút đứng trước người được đếm "1"
order = []
while len(order) < n:
    for _ in range(k - 1):
        prev = prev.next
    out = prev.next                   # người được đếm tới k
    order.append(out.id)
    prev.next = out.next              # loại khỏi vòng, đếm tiếp từ người ngay sau
print(' '.join(map(str, order)))
