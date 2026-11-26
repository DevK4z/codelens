import sys


class Node:
    __slots__ = ('data', 'prev', 'next')

    def __init__(self, data, prev=None, nxt=None):
        self.data, self.prev, self.next = data, prev, nxt


head = tail = None


def push_front(x):
    global head, tail
    node = Node(x, None, head)
    if head:
        head.prev = node
    else:
        tail = node
    head = node


def push_back(x):
    global head, tail
    node = Node(x, tail, None)
    if tail:
        tail.next = node
    else:
        head = node
    tail = node


def pop_front():
    global head, tail
    if head:
        head = head.next
        if head:
            head.prev = None
        else:
            tail = None               # vừa xóa nút cuối cùng


def pop_back():
    global head, tail
    if tail:
        tail = tail.prev
        if tail:
            tail.next = None
        else:
            head = None


tokens = sys.stdin.read().split()
q, pos = int(tokens[0]), 1
for _ in range(q):
    op = tokens[pos]
    pos += 1
    if op in ('H', 'T'):
        (push_front if op == 'H' else push_back)(int(tokens[pos]))
        pos += 1
    elif op == 'DH':
        pop_front()
    else:
        pop_back()

if head is None:
    print('EMPTY')
    print('EMPTY')
else:
    forward, backward = [], []
    p = head
    while p:
        forward.append(str(p.data))
        p = p.next
    p = tail
    while p:                          # đi ngược theo prev
        backward.append(str(p.data))
        p = p.prev
    print(' '.join(forward))
    print(' '.join(backward))
