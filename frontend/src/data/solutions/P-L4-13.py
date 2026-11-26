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

x, y = int(rest[0]), int(rest[1])
p = head
while p and p.value != x:
    p = p.next
if p:
    p.next = Node(y, p.next)          # nút mới trỏ tới nút sau p, rồi p trỏ tới nút mới
print(to_text(head) or 'EMPTY')
