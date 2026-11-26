import sys

s = sys.stdin.readline().strip()
last_seen = {}                        # ký tự -> vị trí gần nhất (bảng băm)
best = left = 0                       # cửa sổ s[left..right] không có ký tự lặp
for right, c in enumerate(s):
    if last_seen.get(c, -1) >= left:  # c đã có trong cửa sổ: nhảy qua lần xuất hiện cũ
        left = last_seen[c] + 1
    last_seen[c] = right
    best = max(best, right - left + 1)
print(best)
