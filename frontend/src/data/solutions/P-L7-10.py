import sys

data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
order = sorted(range(n), key=lambda i: a[i])   # order[k] = chỉ số gốc của phần tử nhỏ thứ k
visited = [False] * n
cycles = 0
for i in range(n):
    if visited[i]:
        continue
    cycles += 1
    j = i
    while not visited[j]:             # đi hết một chu trình
        visited[j] = True
        j = order[j]
print(n - cycles)
