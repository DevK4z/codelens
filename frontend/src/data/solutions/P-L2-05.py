import sys

sys.setrecursionlimit(1 << 16)


def is_palindrome(s, l, r):
    """s[l..r] đối xứng khi hai đầu bằng nhau và phần ở giữa s[l+1..r-1] đối xứng."""
    if l >= r:                        # rỗng hoặc một ký tự
        return True
    if s[l] != s[r]:
        return False
    return is_palindrome(s, l + 1, r - 1)


s = sys.stdin.readline().strip()
print('YES' if is_palindrome(s, 0, len(s) - 1) else 'NO')
