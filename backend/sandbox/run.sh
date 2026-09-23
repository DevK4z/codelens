#!/bin/bash
# run.sh
# Đọc toàn bộ stdin (chứa JSON) vào file tạm
cat > payload.json

# Sử dụng jq để trích xuất code và stdin
jq -r '.code' payload.json > code.cpp
jq -r '.stdin' payload.json > input.txt

# Biên dịch code C++
g++ -std=c++17 -O0 -g -o code code.cpp 2> compile_err.txt
if [ $? -ne 0 ]; then
  # Nếu biên dịch lỗi, xuất ra JSON chứa compilationError để Node.js dễ parse
  jq -n --arg err "$(cat compile_err.txt)" '{compilationError: $err}'
  exit 0
fi

# Chạy chương trình đã biên dịch với input, xuất trace events ra stderr và output ra stdout
./code < input.txt
