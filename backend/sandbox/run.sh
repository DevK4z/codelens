#!/bin/sh
set -eu
cat > payload.json
jq -j '.stdin // ""' payload.json > input.txt
standard=$(jq -r '.standard // "gnu++17"' payload.json)
case "$standard" in
  gnu++17|gnu++20) ;;
  *) echo 'Unsupported C++ standard' >&2; exit 64 ;;
esac
# cpp, c and java build one runnable file named "code" (binary or jar) that can be handed back and
# reused; python and javascript only get a syntax check and run their source. Never interpolate
# anything from the payload into these commands. Keep the runtime flags in step with
# backend/src/runner/languages.ts.
language=$(jq -r '.language // "cpp"' payload.json)
java_flags='-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xms16m -Xmx192m -Xss32m -XX:ReservedCodeCacheSize=32m -XX:MaxMetaspaceSize=96m -XX:CompressedClassSpaceSize=48m'
jvm_tool='-J-XX:+UseSerialGC -J-XX:TieredStopAtLevel=1 -J-Xmx256m -J-XX:ReservedCodeCacheSize=32m -J-XX:MaxMetaspaceSize=96m -J-XX:CompressedClassSpaceSize=48m'
case "$language" in
  cpp) source=code.cpp; compile="g++ -std=$standard -O0 -g -o code code.cpp"; run='./code' ;;
  c) source=code.c; compile='gcc -std=gnu17 -O2 -o code code.c -lm'; run='./code' ;;
  python) source=code.py; compile='python3 -m py_compile code.py'; run='python3 code.py' ;;
  javascript) source=code.js; compile='node --check code.js'; run='node --max-old-space-size=192 --stack-size=7000 code.js' ;;
  java) source=Main.java
    compile="mkdir -p classes && javac $jvm_tool -encoding UTF-8 -d classes Main.java && jar $jvm_tool --create --file code -C classes ."
    run="java $java_flags -cp code Main" ;;
  *) echo 'Unsupported language' >&2; exit 64 ;;
esac
jq -j '.code' payload.json > "$source"
# build: "reuse" runs the ./code the caller placed here, compiled earlier from the same source,
# language and standard. "emit" compiles and, before the program runs, writes the build at the start
# of stdout ("CODELENS-BUILD <length>", base64, newline) so the caller can keep it: nothing the
# program does later can change what was already written. Absent compiles and runs.
build=$(jq -r '.build // ""' payload.json)
# Bound compilation separately from execution.
if [ "$build" != reuse ]; then
  if timeout -k 1 25 sh -c "$compile" > compile_out.txt 2> compile_err.txt; then
    :
  else
    # javac reports errors on stdout.
    cat compile_out.txt >> compile_err.txt
    jq -n --rawfile err compile_err.txt '{compilationError: $err}'
    exit 65
  fi
  if [ "$build" = emit ] && [ -f code ] && [ "$(wc -c < code)" -le 8388608 ]; then
    base64 -w0 code > code.b64
    printf 'CODELENS-BUILD %s\n' "$(wc -c < code.b64)"
    cat code.b64
    printf '\n'
    rm -f code.b64
  fi
fi
# Callers send 5s by default; hosts with a small CPU share may ask for up to 20s.
seconds=$(jq -r '((.timeoutMs // 5000) / 1000 | ceil) | if . < 1 then 1 elif . > 20 then 20 else . end' payload.json)
if [ "$language" = cpp ] && [ "$(jq -r '.debugTrace // false' payload.json)" = "true" ]; then
  status=0
  timeout -k 1 "$seconds" gdb -q -nx -batch -x /usr/local/lib/codelens/gdb_trace.py > gdb.log 2>&1 || status=$?
  # gdb_trace.py writes debug.out itself when GDB finishes normally.
  if [ "$status" = 0 ] && [ -s debug.out ]; then
    cat debug.out
  else
    python3 /usr/local/lib/codelens/debug_result.py "$status"
  fi
else
  # $run is one of the fixed commands above; word splitting is intended.
  # shellcheck disable=SC2086
  timeout -k 1 "$seconds" $run < input.txt
fi
