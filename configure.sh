#!/bin/bash

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


LANGUAGES=$(tr \' " " <<<"$LANGUAGES")
sed -e "s/PROTOCOL/${PROTOCOL}/g" \
     -e "s/HOST_NAME/${HOST_NAME}/g" \
     -e "s/NOMINATIM/${NOMINATIM}/g" \
     -e "s/PRIMARYLABEL/${PRIMARYLABEL}/g" \
     -e "s/SECONDARYLABEL/${SECONDARYLABEL}/g" \
     -e "s/CLIENTID/${CLIENTID}/g" \
     -e "s/COUNTRY/${COUNTRY}/g" \
     -e "s/CENTER/${CENTER}/g" \
     -e "s/ZOOM/${ZOOM}/g" \
     -e "s/LANGUAGES/${LANGUAGES}/g" \
scripts.template.js > web/dist/scripts/scripts.b9157403.js

if [[ ! -f driver.conf ]]; then
     cp driver-app.conf driver.conf
fi
sed -i -e "s/\s[^ ]*\s*#HOST_NAME$/ ${HOST_NAME}; #HOST_NAME/g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT$, ${STATIC_ROOT}; #STATIC_ROOT,g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT_MEDIA$, ${STATIC_ROOT}/zip/; #STATIC_ROOT_MEDIA,g" \
-e "s/http.*#driver-django$/http:\/\/${DJANGO_HOST}:4000; #driver-django/g" \
-e "s/\s[^ ]*\s*#windshaft$/ http:\/\/${WINDSHAFT_HOST}:5000; #windshaft/g" \
driver.conf

#docker exec driver-nginx sed -i -e "s/HOST_NAME/${HOST_NAME}/g" /etc/nginx/conf.d/driver-app.conf

if [ $PROTOCOL == "http" ]
then
     echo "HTTP"
else
     echo "HTTPS"
 #    docker exec driver-nginx certbot
fi
if [ "${EXISTE_DJANGO}" != "" ]; then
     docker exec "driver-django-${CONTAINER_NAME}" ./manage.py collectstatic --noinput
     docker exec "driver-django-${CONTAINER_NAME}" ./manage.py migrate
     while true; do
          read -p "Create superuser?" yn
          case $yn in
               [Yy]* ) docker exec -it $(docker inspect -f '{{.ID}}' driver-django-${CONTAINER_NAME}) python manage.py createsuperuser; break;;
               [Nn]* ) break;;
               * ) echo "Please answer yes or no.";;
          esac
     done


fi
if [ $STATIC_ROOT != $WINDSHAFT_FILES ]; then
     sudo cp -r web "$STATIC_ROOT/"
     sudo cp -r static "$STATIC_ROOT/"
fi

if [ -h "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf" ]; then
     sudo rm "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf"
else
     if [ $PROTOCOL == "http" ]
     then
          echo "Remember to run certbot now."
     fi
fi
sudo ln -s "$(pwd)/driver.conf" "/etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf"
sudo service nginx restart

#docker-compose restart driver-nginx 