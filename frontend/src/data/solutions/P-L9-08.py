import sys

data = sys.stdin.read().split()
n = int(data[0])
groups = {}                           # chữ ký (từ sau khi sắp chữ cái) -> các từ
for w in data[1:1 + n]:
    groups.setdefault(''.join(sorted(w)), []).append(w)
result = sorted(sorted(words) for words in groups.values())   # sắp trong nhóm, rồi theo từ đầu tiên
print(len(result))
print('\n'.join(' '.join(g) for g in result))
