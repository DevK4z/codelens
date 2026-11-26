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
n, k = int(data[0]), int(data[1])
head = build(map(int, data[2:2 + n]))
tail = head
while tail.next:
    tail = tail.next
steps = n - k % n                     # chỉ cần k mod n; đuôi mới cách đuôi cũ `steps` bước
tail.next = head                      # nối thành vòng
new_tail = tail
for _ in range(steps):
    new_tail = new_tail.next
head = new_tail.next
new_tail.next = None                  # cắt vòng
print(to_text(head))
