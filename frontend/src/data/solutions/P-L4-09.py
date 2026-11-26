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
dummy = Node(0, build(map(int, data[2:2 + n])))
prev_tail = dummy                     # đuôi của phần đã xử lý
while True:
    check, cnt = prev_tail.next, 0    # còn đủ k nút không?
    while check and cnt < k:
        check = check.next
        cnt += 1
    if cnt < k:
        break
    group_head = prev_tail.next       # sau khi đảo sẽ thành đuôi nhóm
    prev, cur = check, group_head     # nút đầu nhóm mới trỏ tới phần còn lại
    for _ in range(k):
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    prev_tail.next = prev             # prev là đầu nhóm sau khi đảo
    prev_tail = group_head
print(to_text(dummy.next))
