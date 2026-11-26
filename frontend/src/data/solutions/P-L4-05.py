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
dummy = Node(0, head)                 # nút giả trước head để xóa được cả nút đầu
lead = trail = dummy
for _ in range(k):                    # lead đi trước k bước
    lead = lead.next
while lead.next:                      # khi lead ở nút cuối, trail đứng ngay trước nút cần xóa
    lead = lead.next
    trail = trail.next
trail.next = trail.next.next
print(to_text(dummy.next) or 'EMPTY')
