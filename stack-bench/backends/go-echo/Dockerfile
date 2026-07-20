FROM golang:1.25-alpine AS b
WORKDIR /app
COPY . .
RUN rm -f server && CGO_ENABLED=0 go build -ldflags="-s -w" -o server .
FROM scratch
COPY --from=b /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
