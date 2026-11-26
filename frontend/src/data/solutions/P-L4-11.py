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
head = tail = None
for i in range(n):
    op, x = data[1 + 2 * i], int(data[2 + 2 * i])
    if op == 'H':
        head = Node(x, head)          # nút mới trỏ tới đầu cũ
        if tail is None:
            tail = head
    else:
        node = Node(x)
        if head is None:
            head = tail = node
        else:
            tail.next = node
            tail = node
print(to_text(head) or 'EMPTY')
