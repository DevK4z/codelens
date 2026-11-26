import sys

heap = []                             # min-heap: heap[i] <= heap[2i+1], heap[2i+2]


def push(x):
    heap.append(x)
    i = len(heap) - 1
    while i > 0 and heap[(i - 1) // 2] > heap[i]:   # vun lên
        heap[(i - 1) // 2], heap[i] = heap[i], heap[(i - 1) // 2]
        i = (i - 1) // 2


def pop():
    last = heap.pop()
    if not heap:
        return
    heap[0] = last
    i = 0
    while True:                       # vun xuống
        l, r, smallest = 2 * i + 1, 2 * i + 2, i
        if l < len(heap) and heap[l] < heap[smallest]:
            smallest = l
        if r < len(heap) and heap[r] < heap[smallest]:
            smallest = r
        if smallest == i:
            break
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest


lines = sys.stdin.read().split('\n')
q = int(lines[0])
out = []
for line in lines[1:1 + q]:
    op = line.split()
    if op[0] == 'push':
        push(int(op[1]))
    elif not heap:
        out.append('EMPTY')
    else:
        out.append(str(heap[0]))
        if op[0] == 'pop':
            pop()
print('\n'.join(out))
