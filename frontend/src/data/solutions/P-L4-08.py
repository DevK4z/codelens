import sys


class Node:
    __slots__ = ('digit', 'next')

    def __init__(self, digit, nxt=None):
        self.digit = digit
        self.next = nxt


def build(s):
    """Danh sách theo thứ tự hàng đơn vị trước: chèn từng chữ số vào đầu."""
    head = None
    for ch in s:
        head = Node(int(ch), head)
    return head


a, b = sys.stdin.read().split()
p, q = build(a), build(b)
dummy = tail = Node(0)
carry = 0
while p or q or carry:
    total = carry + (p.digit if p else 0) + (q.digit if q else 0)
    tail.next = Node(total % 10)
    tail = tail.next
    carry = total // 10
    p = p.next if p else None
    q = q.next if q else None
digits = []                           # kết quả đang ở thứ tự hàng đơn vị trước
node = dummy.next
while node:
    digits.append(str(node.digit))
    node = node.next
print(''.join(reversed(digits)))
