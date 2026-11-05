FROM alpine:3.20
RUN apk add --no-cache g++ jq coreutils gdb python3
# Precompile the headers programs start with, using exactly the flags run.sh uses. Parsing them
# dominates compile time on a small CPU share (<bits/stdc++.h> about 23s, <iostream> about 4s at
# 0.1 CPU). GCC uses a .gch only for the first #include of a file and only when flags and earlier
# macros match; otherwise it silently reads the header itself, so results never change.
RUN for name in bits/stdc++.h iostream; do \
      header=$(echo "#include <$name>" | g++ -x c++ -E -H - 2>&1 >/dev/null | awk -v n="/$name" 'substr($2, length($2) - length(n) + 1) == n {print $2; exit}') \
      && mkdir "$header.gch" \
      && for standard in gnu++17 gnu++20; do g++ -std=$standard -O0 -g -x c++-header "$header" -o "$header.gch/$standard.gch"; done \
      && chmod -R a+rX "$header.gch" && du -sh "$header.gch" || exit 1; \
    done
RUN adduser -D -H runner
WORKDIR /sandbox
COPY gdb_trace.py debug_result.py /usr/local/lib/codelens/
COPY run.sh /usr/local/bin/codelens-run
RUN sed -i 's/\r$//' /usr/local/bin/codelens-run \
    && chmod +x /usr/local/bin/codelens-run && chown runner:runner /sandbox
USER runner
ENTRYPOINT ["/usr/local/bin/codelens-run"]
