import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
seg = sorted(zip(data[1:1 + 2 * n:2], data[2:2 + 2 * n:2]))   # theo đầu trái
merged = []
for l, r in seg:
    if merged and l <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], r)   # có điểm chung: nới đoạn cuối
    else:
        merged.append([l, r])
print(len(merged))
print('\n'.join(f'{l} {r}' for l, r in merged))
