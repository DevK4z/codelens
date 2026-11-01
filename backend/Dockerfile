# Backend image for hosts that cannot start a container per run (Render has no Docker-in-Docker).
# This container is the outer boundary; runner/jail.c isolates every submission inside it.
# Build from the repository root: docker build -f backend/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS jail
RUN apk add --no-cache gcc musl-dev libseccomp-dev
COPY runner/jail.c /src/jail.c
RUN gcc -O2 -Wall -Wextra -Werror -o /codelens-jail /src/jail.c -lseccomp

FROM node:22-alpine
RUN apk add --no-cache g++ jq coreutils gdb python3 libseccomp tini
COPY runner/gdb_trace.py runner/debug_result.py /usr/local/lib/codelens/
COPY runner/run.sh /usr/local/bin/codelens-run
COPY --from=jail /codelens-jail /usr/local/bin/codelens-jail
RUN sed -i 's/\r$//' /usr/local/bin/codelens-run \
    && chmod 755 /usr/local/bin/codelens-run /usr/local/bin/codelens-jail
# Precompile <bits/stdc++.h> with exactly the flags run.sh uses. Parsing it dominates compile
# time on a small CPU share (about 23s at 0.1 CPU); GCC picks the matching .gch automatically
# and silently falls back to the header when flags or earlier macros differ.
RUN header=$(echo '#include <bits/stdc++.h>' | g++ -x c++ -E -H - 2>&1 >/dev/null | awk '/bits\/stdc\+\+\.h$/ {print $2; exit}') \
    && mkdir "$header.gch" \
    && for standard in gnu++17 gnu++20; do g++ -std=$standard -O0 -g -x c++-header "$header" -o "$header.gch/$standard.gch"; done \
    && chmod -R a+rX "$header.gch" && du -sh "$header.gch"
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Runs as root on purpose: the jail needs it to switch each submission to its own uid.
ENV NODE_ENV=production RUNNER=sandbox HOST=0.0.0.0 PORT=10000
EXPOSE 10000
# tini reaps processes orphaned by submissions; Node as PID 1 would leave them as zombies.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
