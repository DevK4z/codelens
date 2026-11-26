import sys
import threading


def main():
    data = list(map(int, sys.stdin.read().split()))
    n = data[0]
    pre = data[1:1 + n]
    pos_inorder = {x: i for i, x in enumerate(data[1 + n:1 + 2 * n])}   # khóa -> vị trí trong trung tự
    post = []
    next_pre = 0                      # phần tử tiếp theo của tiền tự là gốc của cây con đang dựng

    def build(lo, hi):
        """Dựng cây con có các khóa ở inorder[lo..hi] và ghi hậu tự của nó."""
        nonlocal next_pre
        if lo > hi:
            return
        root = pre[next_pre]
        next_pre += 1
        mid = pos_inorder[root]
        build(lo, mid - 1)            # cây con trái đứng ngay sau gốc trong tiền tự
        build(mid + 1, hi)
        post.append(root)             # hậu tự: trái, phải, rồi gốc

    build(0, n - 1)
    print(' '.join(map(str, post)))


# Cây suy biến sâu tới n tầng: tăng giới hạn đệ quy và chạy trong luồng có ngăn xếp lớn.
sys.setrecursionlimit(1 << 20)
threading.stack_size(1 << 27)
threading.Thread(target=main).start()
