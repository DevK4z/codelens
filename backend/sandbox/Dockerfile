FROM alpine:3.18

RUN apk add --no-cache g++ jq bash

WORKDIR /sandbox
COPY run.sh /sandbox/
RUN chmod +x /sandbox/run.sh

# Chạy bằng user không đặc quyền để an toàn
RUN adduser -D runner && chown -R runner:runner /sandbox
USER runner

CMD ["/sandbox/run.sh"]
