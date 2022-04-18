#!/bin/bash

docker-compose up -d
if [[ ! -d "zip" ]]; then
     mkdir zip
fi

while read line; do export "$line"; done < .env

while read line; do echo "$line"; done < .env


echo ${CONTAINER_NAME}

EXISTE_DJANGO=$(docker ps | grep driver-django-${CONTAINER_NAME})
EXISTE_CELERY=$(docker ps | grep driver-celery-${CONTAINER_NAME})
DJANGO_HOST="localhost"
if [ "${EXISTE_DJANGO}" != "" ]; then
     DJANGO_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-django-${CONTAINER_NAME})
fi
CELERY_HOST="localhost"
if [ "${EXISTE_CELERY}" != "" ]; then
     CELERY_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-celery-${CONTAINER_NAME})
fi
WINDSHAFT_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' windshaft-${CONTAINER_NAME})
if [ "${WINDSHAFT_HOST}" == "" ]; then
     echo "Windshaft did not start."
     exit
fi
STATIC_ROOT=$(pwd)
if [[ ! -f driver-${CONTAINER_NAME}.conf ]]; then
     cp driver.conf driver-${CONTAINER_NAME}.conf
fi
sed -i -e "s/\s[^ ]*\s*#HOST_NAME$/ ${HOST_NAME}; #HOST_NAME/g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT$, ${STATIC_ROOT}; #STATIC_ROOT,g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT_MEDIA$, ${STATIC_ROOT}/zip/; #STATIC_ROOT_MEDIA,g" \
-e "s/http.*#driver-django$/http:\/\/${DJANGO_HOST}:4000; #driver-django/g" \
-e "s/\s[^ ]*\s*#windshaft$/ http:\/\/${WINDSHAFT_HOST}:5000; #windshaft/g" \
-e "s,\s[^ ]*\s*#ALPHA_ROOT$, ${STATIC_ROOT}/static/dist/; #ALPHA_ROOT,g" \
-e "s,\s[^ ]*\s*#FAVICON$, ${STATIC_ROOT}/static/dist/favicon.ico; #FAVICON,g" \
driver-${CONTAINER_NAME}.conf

#docker exec driver-nginx sed -i -e "s/HOST_NAME/${HOST_NAME}/g" /etc/nginx/conf.d/driver-app.conf

if [ $PROTOCOL == "http" ]
then
     echo "HTTP"
else
     echo "HTTPS"
 #    docker exec driver-nginx certbot
fi
if [ "${EXISTE_DJANGO}" != "" ]; then 
     [ -e "${STATIC_ROOT}/static/*" ] && sudo rm -rf ${STATIC_ROOT}/static/*
     docker exec "driver-django-${CONTAINER_NAME}" ./manage.py collectstatic --noinput
     docker exec "driver-django-${CONTAINER_NAME}" ./manage.py migrate
#     while true; do
#          read -p "Create superuser?" yn
#          case $yn in
#               [Yy]* ) docker exec -it $(docker inspect -f '{{.ID}}' driver-django-${CONTAINER_NAME}) python manage.py createsuperuser; break;;
#               [Nn]* ) break;;
#               * ) echo "Please answer yes or no.";;
#          esac
#     done
     docker-compose up -d
fi

[ -e "./mapserver/*" ] && sudo rm ./mapserver/*

if [ -h "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf" ]; then
     sudo rm "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf"
else
     if [ $PROTOCOL == "http" ]
     then
          echo "Remember to run certbot now."
     fi
fi
sudo ln -s "$(pwd)/driver-${CONTAINER_NAME}.conf" "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf"
sudo service nginx restart

#docker-compose restart driver-nginx 
