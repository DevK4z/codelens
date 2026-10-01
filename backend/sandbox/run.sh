#!/bin/sh
set -eu
cat > payload.json
jq -j '.code' payload.json > code.cpp
jq -j '.stdin // ""' payload.json > input.txt
standard=$(jq -r '.standard // "gnu++17"' payload.json)
case "$standard" in
  gnu++17|gnu++20) ;;
  *) echo 'Unsupported C++ standard' >&2; exit 64 ;;
esac
# Bound compilation separately from execution. Never interpolate compiler flags from source.
if timeout -k 1 25 g++ -std="$standard" -O0 -g -o code code.cpp 2> compile_err.txt; then
  :
else
  jq -n --rawfile err compile_err.txt '{compilationError: $err}'
  exit 65
fi
seconds=$(jq -r '((.timeoutMs // 5000) / 1000 | ceil) | if . < 1 then 1 elif . > 5 then 5 else . end' payload.json)
timeout -k 1 "$seconds" ./code < input.txt
