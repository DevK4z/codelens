import sys


class Node:
    __slots__ = ('key', 'size', 'left', 'right')

    def __init__(self, key):
        self.key = key
        self.size = 1                 # số nút của cây con gốc tại đây
        self.left = self.right = None


def insert(root, key):
    if root is None:
        return Node(key)
    cur = root
    while True:
        cur.size += 1                 # khóa mới sẽ nằm trong cây con này
        side = 'left' if key < cur.key else 'right'
        child = getattr(cur, side)
        if child is None:
            setattr(cur, side, Node(key))
            return root
        cur = child


def kth(t, k):
    while True:
        left_size = t.left.size if t.left else 0
        if k <= left_size:            # nằm trong cây con trái
            t = t.left
        elif k == left_size + 1:      # chính là nút này
            return t.key
        else:                         # bỏ qua cây trái và nút này
            k -= left_size + 1
            t = t.right


data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
root = None
for key in data[2:2 + n]:
    root = insert(root, key)
print('\n'.join(str(kth(root, k)) for k in data[2 + n:2 + n + q]))
