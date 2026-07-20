FROM oven/bun:1-alpine
WORKDIR /app
COPY . .
RUN bun install --production 2>/dev/null || true
CMD ["bun","server.js"]
