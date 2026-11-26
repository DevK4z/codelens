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


data = sys.stdin.read().split()
n = int(data[0])
root = None
for k in data[1:1 + n]:
    root = insert(root, int(k))
sums = []
level = [root]
while level:                          # duyệt theo từng mức
    sums.append(sum(t.key for t in level))
    level = [c for t in level for c in (t.left, t.right) if c]
print(' '.join(map(str, sums)))
