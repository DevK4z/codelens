import sys

board = [0] * 81
row_mask = [0] * 9                    # bit d bật: chữ số d đã có trong hàng
col_mask = [0] * 9
box_mask = [0] * 9


def box_of(r, c):
    return r // 3 * 3 + c // 3


def toggle(i, d):
    r, c, bit = i // 9, i % 9, 1 << d
    row_mask[r] ^= bit
    col_mask[c] ^= bit
    box_mask[box_of(r, c)] ^= bit


def solve():
    # Chọn ô trống có ít ứng viên nhất để cắt nhánh sớm.
    best, best_mask, best_count = -1, 0, 10
    for i in range(81):
        if board[i]:
            continue
        r, c = i // 9, i % 9
        mask = ~(row_mask[r] | col_mask[c] | box_mask[box_of(r, c)]) & 0x3FE   # bit 1..9
        cnt = bin(mask).count('1')
        if cnt == 0:                  # ô này không còn chữ số nào
            return False
        if cnt < best_count:
            best, best_mask, best_count = i, mask, cnt
    if best == -1:                    # đã điền hết
        return True
    for d in range(1, 10):
        if best_mask >> d & 1:
            board[best] = d
            toggle(best, d)
            if solve():
                return True
            toggle(best, d)
            board[best] = 0
    return False


rows = sys.stdin.read().split()
for r in range(9):
    for c in range(9):
        if rows[r][c] != '.':
            board[r * 9 + c] = int(rows[r][c])
            toggle(r * 9 + c, board[r * 9 + c])
solve()
print('\n'.join(''.join(map(str, board[r * 9:(r + 1) * 9])) for r in range(9)))
