import sys

class Node:
    __slots__ = ('value', 'next')

    def __init__(self, value, nxt=None):
        self.value = value
        self.next = nxt


def build(values):
    """Thêm lần lượt vào cuối danh sách, trả về nút đầu."""
    dummy = tail = Node(0)
    for v in values:
        tail.next = Node(v)
        tail = tail.next
    return dummy.next


def to_text(head):
    out = []
    while head:
        out.append(str(head.value))
        head = head.next
    return ' '.join(out)

data = sys.stdin.read().split()
n = int(data[0])
head = build(map(int, data[1:1 + n]))
rest = data[1 + n:]                   # phần dữ liệu sau danh sách

x = int(rest[0])
first, count, pos = -1, 0, 1
p = head
while p:
    if p.value == x:
        if first == -1:
            first = pos
        count += 1
    p, pos = p.next, pos + 1
print(first, count)
