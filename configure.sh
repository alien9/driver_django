#!/bin/bash

DJANGO_HOST=driver-django-vidasegura
CELERY_HOST=driver-celery-vidasegura
HOST_NAME=vidasegura.cetsp.com.br
STATIC_ROOT=/opt/vidasegura/static
if [[ ! -f driver-vidasegura.conf ]]; then
     cp driver.conf driver-vidasegura.conf
fi
sed -i -e "s/\s[^ ]*\s*#HOST_NAME$/ ${HOST_NAME}; #HOST_NAME/g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT$, ${STATIC_ROOT}; #STATIC_ROOT,g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT_MEDIA$, ${STATIC_ROOT}/zip/; #STATIC_ROOT_MEDIA,g" \
-e "s/http.*#driver-django$/http:\/\/${DJANGO_HOST}:4000; #driver-django/g" \
-e "s,\s[^ ]*\s*#ALPHA_ROOT$, ${STATIC_ROOT}/static/dist/; #ALPHA_ROOT,g" \
-e "s,\s[^ ]*\s*#FAVICON$, ${STATIC_ROOT}/static/dist/favicon.ico; #FAVICON,g" \
driver-vidasegura.conf

docker exec "driver-django-vidasegura" ./manage.py collectstatic --noinput
docker exec "driver-django-vidasegura" ./manage.py migrate

sudo ln -s "$(pwd)/driver-vidasegura.conf" "/etc/nginx/sites-enabled/driver-vidasegura.conf"
sudo service nginx restart

