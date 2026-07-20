FROM php:8.3-cli-alpine
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
RUN rm -rf vendor && composer install --no-dev --no-interaction --quiet
CMD ["php","artisan","serve","--host=0.0.0.0"]
