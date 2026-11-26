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


data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = build(data[1:1 + n])
m = data[1 + n]
b = build(data[2 + n:2 + n + m])
dummy = tail = Node(0)
while a and b:
    if a.value <= b.value:
        tail.next, a = a, a.next
    else:
        tail.next, b = b, b.next
    tail = tail.next
tail.next = a if a else b             # phần còn lại đã được sắp sẵn
print(to_text(dummy.next))
