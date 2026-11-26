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
p = head
while p and p.next:
    if p.next.value == p.value:
        p.next = p.next.next          # bỏ nút trùng khỏi danh sách
    else:
        p = p.next
print(to_text(head))
