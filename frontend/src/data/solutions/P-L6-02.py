import sys

class Node:
    __slots__ = ('key', 'left', 'right')

    def __init__(self, key):
        self.key = key
        self.left = self.right = None


def insert(root, key):
    """Chèn lặp (không đệ quy) để cây suy biến nhiều tầng cũng không chạm giới hạn đệ quy."""
    node = Node(key)
    if root is None:
        return node
    cur = root
    while True:
        if key < cur.key:
            if cur.left is None:
                cur.left = node
                return root
            cur = cur.left
        else:
            if cur.right is None:
                cur.right = node
                return root
            cur = cur.right


data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
root = None
for k in data[2:2 + n]:
    root = insert(root, k)
out = []
pos = 2 + n
for _ in range(q):
    u, v = data[pos], data[pos + 1]
    pos += 2
    cur = root
    while True:
        if u < cur.key and v < cur.key:
            cur = cur.left
        elif u > cur.key and v > cur.key:
            cur = cur.right
        else:
            break                     # u và v tách về hai phía (hoặc một trong hai là cur)
    out.append(cur.key)
print('\n'.join(map(str, out)))
