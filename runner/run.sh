#!/bin/sh
# CodeLens C++ Sandbox Runner
# Usage: echo '<code>' | ./run.sh
set -e
cat > /tmp/code.cpp
g++ -std=c++17 -O0 -o /tmp/code /tmp/code.cpp
timeout 5 /tmp/code

