FROM alpine:3.20
RUN apk add --no-cache g++ jq coreutils
RUN adduser -D -H runner
WORKDIR /sandbox
COPY run.sh /usr/local/bin/codelens-run
RUN chmod +x /usr/local/bin/codelens-run && chown runner:runner /sandbox
USER runner
ENTRYPOINT ["/usr/local/bin/codelens-run"]
