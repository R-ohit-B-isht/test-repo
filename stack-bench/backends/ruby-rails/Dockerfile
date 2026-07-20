FROM ruby:3.0-slim
WORKDIR /app
RUN apt-get update -qq && apt-get install -y --no-install-recommends build-essential libpq-dev git && rm -rf /var/lib/apt/lists/*
COPY Gemfile ./
RUN sed -i "s/^ruby .*/ruby \">= 3.0\"/" Gemfile && bundle install --quiet
COPY . .
ENV RAILS_ENV=production SECRET_KEY_BASE=deadbeef
CMD ["bin/rails","server","-p","8080","-e","production"]
