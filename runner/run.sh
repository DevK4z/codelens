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
# build: "reuse" runs the ./code the caller placed here, compiled earlier from the same source and
# standard. "emit" compiles and, before the program runs, writes the binary at the start of stdout
# ("CODELENS-BUILD <length>", base64, newline) so the caller can keep it: nothing the program does
# later can change what was already written. Absent compiles and runs.
build=$(jq -r '.build // ""' payload.json)
# Bound compilation separately from execution. Never interpolate compiler flags from source.
if [ "$build" != reuse ]; then
  if timeout -k 1 25 g++ -std="$standard" -O0 -g -o code code.cpp 2> compile_err.txt; then
    :
  else
    jq -n --rawfile err compile_err.txt '{compilationError: $err}'
    exit 65
  fi
  if [ "$build" = emit ] && [ "$(wc -c < code)" -le 8388608 ]; then
    base64 -w0 code > code.b64
    printf 'CODELENS-BUILD %s\n' "$(wc -c < code.b64)"
    cat code.b64
    printf '\n'
    rm -f code.b64
  fi
fi
# Callers send 5s by default; hosts with a small CPU share may ask for up to 20s.
seconds=$(jq -r '((.timeoutMs // 5000) / 1000 | ceil) | if . < 1 then 1 elif . > 20 then 20 else . end' payload.json)
if [ "$(jq -r '.debugTrace // false' payload.json)" = "true" ]; then
  status=0
  timeout -k 1 "$seconds" gdb -q -nx -batch -x /usr/local/lib/codelens/gdb_trace.py > gdb.log 2>&1 || status=$?
  # gdb_trace.py writes debug.out itself when GDB finishes normally.
  if [ "$status" = 0 ] && [ -s debug.out ]; then
    cat debug.out
  else
    python3 /usr/local/lib/codelens/debug_result.py "$status"
  fi
else
  timeout -k 1 "$seconds" ./code < input.txt
fi
