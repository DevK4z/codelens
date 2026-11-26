import sys
from functools import cmp_to_key


def compare(x, y):
    """x đứng trước y khi ghép "x rồi y" cho số lớn hơn "y rồi x"."""
    if x + y > y + x:
        return -1
    return 1 if x + y < y + x else 0


data = sys.stdin.read().split()
n = int(data[0])
nums = sorted(data[1:1 + n], key=cmp_to_key(compare))
print('0' if nums[0] == '0' else ''.join(nums))   # số lớn nhất là 0 nghĩa là mọi số đều là 0
