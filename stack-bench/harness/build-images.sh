#!/bin/bash
# Builds real Docker images for every backend and records measured sizes.
# Usage: build-images.sh [name ...]  (default: all)
set -u
cd "$(dirname "$0")/../backends"
OUT=../results/image-sizes-measured.json
export PATH=$PATH:/usr/local/go/bin

write_df() { printf '%s\n' "$2" > "$1/Dockerfile"; }

# Go: static rebuild -> scratch
for d in go-nethttp go-fiber go-echo go-gin; do
  write_df $d 'FROM golang:1.25-alpine AS b
WORKDIR /app
COPY . .
RUN rm -f server && CGO_ENABLED=0 go build -ldflags="-s -w" -o server .
FROM scratch
COPY --from=b /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]'
done

# Rust: use prebuilt release binary on slim debian (build ran locally)
for d in rust-axum rust-actix; do
  write_df $d 'FROM rust:1-slim AS b
WORKDIR /app
COPY . .
RUN cargo build --release && find target/release -maxdepth 1 -type f -executable -name "bench-*" -exec cp {} /server-bin \;
FROM debian:bookworm-slim
COPY --from=b /server-bin /server
ENTRYPOINT ["/server"]'
done

# Node
for d in node-express node-fastify node-hono node-nestjs; do
  write_df $d 'FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
CMD ["node","server.js"]'
done
write_df node-nestjs 'FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
CMD ["node","dist/main.js"]'

# Bun
for d in bun-hono bun-elysia; do
  write_df $d 'FROM oven/bun:1-alpine
WORKDIR /app
COPY . .
RUN bun install --production 2>/dev/null || true
CMD ["bun","server.js"]'
done

# Deno
write_df deno-oak 'FROM denoland/deno:alpine
WORKDIR /app
COPY . .
CMD ["deno","run","-A","server.ts"]'
write_df deno-fresh 'FROM denoland/deno:alpine
WORKDIR /app
COPY . .
CMD ["deno","serve","-A","--port","8080","_fresh/server.js"]'

# Python
write_df py-fastapi 'FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn
COPY . .
CMD ["uvicorn","main:app","--host","0.0.0.0"]'
write_df py-flask 'FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir flask gunicorn
COPY . .
CMD ["gunicorn","app:app"]'
write_df py-django 'FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir django gunicorn
COPY . .
CMD ["gunicorn","proj.wsgi"]'

# Java (prebuilt jars)
write_df java-spring 'FROM eclipse-temurin:17-jre
COPY target/*.jar /app.jar
ENTRYPOINT ["java","-jar","/app.jar"]'
write_df java-vertx 'FROM eclipse-temurin:17-jre
COPY target/java-vertx-1.0.jar /app.jar
ENTRYPOINT ["java","-jar","/app.jar"]'

# C# (publish output)
write_df csharp-minimal 'FROM mcr.microsoft.com/dotnet/sdk:8.0 AS b
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /out
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY --from=b /out /app
WORKDIR /app
ENTRYPOINT ["dotnet","csharp-minimal.dll"]'

# Elixir Phoenix (mix release)
write_df elixir-phoenix 'FROM elixir:1.16-alpine AS b
WORKDIR /app
RUN apk add --no-cache git build-base && mix local.hex --force && mix local.rebar --force
COPY . .
ENV MIX_ENV=prod SECRET_KEY_BASE=devbenchsecretdevbenchsecretdevbenchsecretdevbenchsecret
RUN rm -rf _build deps && mix deps.get --only prod && mix compile && mix release
FROM alpine:3.19
RUN apk add --no-cache libstdc++ ncurses openssl
COPY --from=b /app/_build/prod/rel/bench_phx /app
ENV SECRET_KEY_BASE=devbenchsecretdevbenchsecretdevbenchsecretdevbenchsecret PHX_SERVER=true
CMD ["/app/bin/bench_phx","start"]'

# PHP Laravel
write_df php-laravel 'FROM php:8.3-cli-alpine
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
RUN rm -rf vendor && composer install --no-dev --no-interaction --quiet
CMD ["php","artisan","serve","--host=0.0.0.0"]'

# Ruby Rails
write_df ruby-rails 'FROM ruby:3.0-slim
WORKDIR /app
RUN apt-get update -qq && apt-get install -y --no-install-recommends build-essential libpq-dev git && rm -rf /var/lib/apt/lists/*
COPY Gemfile ./
RUN sed -i "s/^ruby .*/ruby \">= 3.0\"/" Gemfile && bundle install --quiet
COPY . .
ENV RAILS_ENV=production SECRET_KEY_BASE=deadbeef
CMD ["bin/rails","server","-p","8080","-e","production"]'

NAMES="${@:-go-nethttp go-fiber go-echo go-gin rust-axum rust-actix node-express node-fastify node-hono node-nestjs bun-hono bun-elysia deno-oak deno-fresh py-fastapi py-flask py-django java-spring java-vertx csharp-minimal elixir-phoenix php-laravel ruby-rails}"
[ -f $OUT ] || echo '{}' > $OUT
for n in $NAMES; do
  echo "=== building $n"
  printf '%s\n' node_modules target _build deps .git log tmp > $n/.dockerignore 2>/dev/null
  if [ "$n" = "java-spring" ] || [ "$n" = "java-vertx" ]; then rm -f $n/.dockerignore; fi
  if docker build -q -t bench-$n $n > /tmp/build-$n.log 2>&1; then
    SZ=$(docker image inspect bench-$n --format '{{.Size}}')
    MB=$(python3 -c "print(round($SZ/1048576,1))")
    echo "$n OK ${MB}MB"
    python3 -c "import json;d=json.load(open('$OUT'));d['$n']=$MB;json.dump(d,open('$OUT','w'),indent=2)"
  else
    echo "$n FAILED"; tail -3 /tmp/build-$n.log
    python3 -c "import json;d=json.load(open('$OUT'));d['$n']='build-failed';json.dump(d,open('$OUT','w'),indent=2)"
  fi
done
cat $OUT
