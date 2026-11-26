import sys
import heapq
from collections import Counter

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
freq = Counter(data[2:2 + n])
# k phần tử "tốt nhất": tần suất lớn hơn, bằng nhau thì từ nhỏ hơn theo từ điển.
top = heapq.nsmallest(k, freq.items(), key=lambda wf: (-wf[1], wf[0]))
print('\n'.join(f'{w} {f}' for w, f in top))
