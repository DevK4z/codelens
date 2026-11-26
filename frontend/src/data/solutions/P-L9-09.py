import sys

s, t = sys.stdin.read().split()
need = {}                             # need[c] > 0: cửa sổ còn thiếu c; < 0: đang thừa
for c in t:
    need[c] = need.get(c, 0) + 1
missing = len(t)
best_len, best_start = -1, 0
l = 0
for r, c in enumerate(s):
    if need.get(c, 0) > 0:
        missing -= 1
    need[c] = need.get(c, 0) - 1
    if missing > 0:
        continue
    while need[s[l]] < 0:             # bỏ ký tự thừa ở bên trái
        need[s[l]] += 1
        l += 1
    if best_len == -1 or r - l + 1 < best_len:
        best_len, best_start = r - l + 1, l
    need[s[l]] += 1                   # bỏ s[l]: lại thiếu đúng một ký tự
    l += 1
    missing += 1
print(-1 if best_len == -1 else s[best_start:best_start + best_len])
