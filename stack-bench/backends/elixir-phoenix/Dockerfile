FROM elixir:1.16-alpine AS b
WORKDIR /app
RUN apk add --no-cache git build-base && mix local.hex --force && mix local.rebar --force
COPY . .
ENV MIX_ENV=prod SECRET_KEY_BASE=devbenchsecretdevbenchsecretdevbenchsecretdevbenchsecret
RUN rm -rf _build deps && mix deps.get --only prod && mix compile && mix release
FROM alpine:3.19
RUN apk add --no-cache libstdc++ ncurses openssl
COPY --from=b /app/_build/prod/rel/bench_phx /app
ENV SECRET_KEY_BASE=devbenchsecretdevbenchsecretdevbenchsecretdevbenchsecret PHX_SERVER=true
CMD ["/app/bin/bench_phx","start"]
