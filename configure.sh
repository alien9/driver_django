#!/bin/bash
docker-compose up -d
DJANGO_HOST=driver-django-vidasegura
CELERY_HOST=driver-celery-vidasegura
HOST_NAME=sp.driver.net
STATIC_ROOT=/home/tiago/works/driver_django
DJANGO_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-django-vidasegura)
CELERY_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-celery-vidasegura)
GEOSERVER=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-geoserver-vidasegura)

if [[ -d static ]]; then
     sudo rm -fr static/*
fi

if [[ ! -f driver-vidasegura.conf ]]; then
     cp driver.conf driver-vidasegura.conf
fi
sed -i -e "s/\s[^ ]*\s*#HOST_NAME$/ ${HOST_NAME}; #HOST_NAME/g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT$, ${STATIC_ROOT}; #STATIC_ROOT,g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT_MEDIA$, ${STATIC_ROOT}/zip/; #STATIC_ROOT_MEDIA,g" \
-e "s/http.*#driver-django$/http:\/\/${DJANGO_HOST}:4000; #driver-django/g" \
-e "s,\s[^ ]*\s*#ALPHA_ROOT$, ${STATIC_ROOT}/static/dist/; #ALPHA_ROOT,g" \
-e "s,\s[^ ]*\s*#GEOSERVER, http:\/\/${GEOSERVER}:8080; #GEOSERVER,g" \
-e "s,\s[^ ]*\s*#FAVICON$, ${STATIC_ROOT}/static/dist/favicon.ico; #FAVICON,g" \
driver-vidasegura.conf

docker exec "driver-django-vidasegura" ./manage.py collectstatic --noinput
docker exec "driver-django-vidasegura" ./manage.py makemigrations
docker exec "driver-django-vidasegura" ./manage.py migrate
if [[ -f /etc/nginx/sites-enabled/driver-vidasegura.conf ]]; then
     sudo rm /etc/nginx/sites-enabled/driver-vidasegura.conf
fi
sudo ln -s "$(pwd)/driver-vidasegura.conf" "/etc/nginx/sites-enabled/driver-vidasegura.conf"
sudo service nginx restart

