import sys


class Node:
    __slots__ = ('value', 'next')

    def __init__(self, value):
        self.value = value
        self.next = None


data = sys.stdin.read().split()
n = int(data[0])
head = tail = None
for x in data[1:1 + n]:          # thêm vào cuối bằng con trỏ tail: O(1) mỗi lần
    node = Node(int(x))
    if head is None:
        head = tail = node
    else:
        tail.next = node
        tail = node

prev, cur = None, head           # đảo con trỏ next tại chỗ
while cur:
    nxt = cur.next
    cur.next = prev
    prev, cur = cur, nxt
head = prev

out = []
p = head
while p:
    out.append(str(p.value))
    p = p.next
print(' '.join(out))
