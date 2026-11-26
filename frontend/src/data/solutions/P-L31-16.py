import sys

n = int(sys.stdin.readline())
ways = [1] + [0] * n                  # ways[v]: số cách phân tích v (thứ tự số hạng không quan trọng)
for x in range(1, n + 1):             # xét lần lượt từng số hạng x để không đếm trùng hoán vị
    for v in range(x, n + 1):
        ways[v] += ways[v - x]
print(ways[n])
