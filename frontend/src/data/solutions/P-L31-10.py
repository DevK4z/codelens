import sys

data = list(map(int, sys.stdin.read().split()))
n, M = data[0], data[1]
# dp[j] = giá trị lớn nhất với tổng khối lượng không vượt j, chỉ dùng các vật đã xét.
dp = [0] * (M + 1)
for i in range(n):
    w, v = data[2 + 2 * i], data[3 + 2 * i]
    # Duyệt j giảm dần để mỗi vật chỉ được dùng một lần (dp[j - w] vẫn là giá trị của hàng trước).
    for j in range(M, w - 1, -1):
        if dp[j - w] + v > dp[j]:
            dp[j] = dp[j - w] + v
print(dp[M])
