import sys

n = int(sys.stdin.readline())
if n < 2:
    print(0)
else:
    is_prime = bytearray([1]) * (n + 1)
    is_prime[0] = is_prime[1] = 0
    i = 2
    while i * i <= n:
        if is_prime[i]:
            # bội nhỏ hơn i*i đã bị gạch trước đó; gán cả lát cắt một lần cho nhanh
            is_prime[i * i::i] = bytes(len(range(i * i, n + 1, i)))
        i += 1
    print(sum(is_prime))
