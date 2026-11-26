import sys

s = sys.stdin.readline().strip()
parts, result = [], []


def valid_part(p):
    if len(p) > 1 and p[0] == '0':    # không có số 0 thừa ở đầu
        return False
    return int(p) <= 255


def backtrack(pos):
    left, need = len(s) - pos, 4 - len(parts)
    if left < need or left > need * 3:   # không thể chia đủ phần còn lại
        return
    if need == 0:
        result.append('.'.join(parts))
        return
    for length in range(1, 4):
        p = s[pos:pos + length]
        if len(p) < length or not valid_part(p):
            continue
        parts.append(p)
        backtrack(pos + length)
        parts.pop()


backtrack(0)
result.sort()
print('\n'.join([str(len(result))] + result))
