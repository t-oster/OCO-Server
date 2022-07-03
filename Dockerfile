FROM php:7.4-apache
WORKDIR /var/www/oco
ENV APACHE_DOCUMENT_ROOT /var/www/oco/frontend
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf && \
    a2enmod rewrite && \
    apt-get update && apt-get install -y libzip-dev zip && \
    docker-php-ext-install pdo_mysql zip
COPY . /var/www/oco
