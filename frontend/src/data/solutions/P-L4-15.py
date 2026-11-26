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


def merge(a, b):
    dummy = tail = Node(0)
    while a and b:
        if a.value <= b.value:        # <= giữ thứ tự ổn định
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a if a else b
    return dummy.next


def merge_sort(head):
    if head is None or head.next is None:
        return head
    slow, fast = head, head.next      # tìm giữa danh sách bằng hai con trỏ
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    second = slow.next
    slow.next = None                  # cắt đôi
    return merge(merge_sort(head), merge_sort(second))


data = sys.stdin.read().split()
n = int(data[0])
head = build(map(int, data[1:1 + n]))
rest = data[1 + n:]                   # phần dữ liệu sau danh sách

print(to_text(merge_sort(head)) or 'EMPTY')
