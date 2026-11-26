import sys


def digit_sum(n):
    """Tổng các chữ số của n, viết đệ quy."""
    if n < 10:                          # điều kiện dừng: chỉ còn một chữ số
        return n
    return n % 10 + digit_sum(n // 10)  # chữ số cuối + tổng chữ số phần còn lại


n = int(sys.stdin.readline())
print(digit_sum(n))
