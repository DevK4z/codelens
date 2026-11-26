import sys

data = sys.stdin.read().split()
n, W = int(data[0]), int(data[1])
w = sorted(map(int, data[2:2 + n]))
lightest, heaviest, boats = 0, n - 1, 0
while lightest <= heaviest:
    if lightest < heaviest and w[lightest] + w[heaviest] <= W:
        lightest += 1                 # ghép được hai người
    heaviest -= 1                     # người nặng nhất lên thuyền
    boats += 1
print(boats)
