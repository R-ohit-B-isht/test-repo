FROM rust:1-slim AS b
WORKDIR /app
COPY . .
RUN cargo build --release && find target/release -maxdepth 1 -type f -executable -name "bench-*" -exec cp {} /server-bin \;
FROM debian:bookworm-slim
COPY --from=b /server-bin /server
ENTRYPOINT ["/server"]
