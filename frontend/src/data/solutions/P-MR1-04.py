import sys

s = sys.stdin.readline().strip()
n = len(s)
best_len, best_start = 1, 0


def expand(l, r):
    """Nở từ tâm (l, r) và cập nhật đoạn đối xứng dài nhất."""
    global best_len, best_start
    while l >= 0 and r < n and s[l] == s[r]:
        l -= 1
        r += 1
    length = r - l - 1                # đoạn đối xứng là s[l+1 .. r-1]
    if length > best_len:             # chỉ nhận khi dài hơn hẳn: giữ đoạn bắt đầu sớm nhất
        best_len, best_start = length, l + 1


for i in range(n):
    expand(i, i)                      # tâm là một ký tự
    expand(i, i + 1)                  # tâm nằm giữa hai ký tự
print(best_len)
print(s[best_start:best_start + best_len])
