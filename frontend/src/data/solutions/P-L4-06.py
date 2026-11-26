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
if head:
    odd = head                        # cuối danh sách các nút vị trí lẻ
    even_head = even = head.next      # đầu và cuối danh sách các nút vị trí chẵn
    while even and even.next:
        odd.next = even.next          # nút lẻ kế tiếp
        odd = odd.next
        even.next = odd.next          # nút chẵn kế tiếp
        even = even.next
    odd.next = even_head              # nối nhóm chẵn vào sau nhóm lẻ
print(to_text(head))
