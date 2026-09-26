#!/bin/sh
# CodeLens C++ Sandbox Runner
# Reads JSON {"code":"...","stdin":"..."} from stdin, compiles and runs C++ code.
# Trace events go to stderr, program stdout goes to stdout.

set -e

# Read entire stdin as JSON payload
PAYLOAD=$(cat)

# Extract 'code' and 'stdin' fields using jq
echo "$PAYLOAD" | jq -r '.code' > /tmp/code.cpp
echo "$PAYLOAD" | jq -r '.stdin // empty' > /tmp/input.txt

# Compile
if ! COMPILE_ERR=$(g++ -std=c++17 -O0 -o /tmp/code /tmp/code.cpp 2>&1); then
  # Escape the compilation error for JSON output
  ESCAPED=$(printf '%s' "$COMPILE_ERR" | jq -Rs .)
  printf '{"compilationError": %s}\n' "$ESCAPED"
  exit 0
fi

# Run with stdin from input.txt
timeout 5 /tmp/code < /tmp/input.txt
