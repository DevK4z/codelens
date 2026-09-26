FROM alpine:3.20
RUN apk add --no-cache g++ libstdc++ jq
RUN adduser -D -H sandbox
WORKDIR /sandbox
COPY run.sh /sandbox/run.sh
RUN chmod +x /sandbox/run.sh
USER sandbox
ENTRYPOINT ["/sandbox/run.sh"]

