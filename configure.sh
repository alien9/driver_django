#!/bin/bash

if [[ ! -d "nginx" ]]; then
     mkdir nginx
fi
if [[ ! -d "zip" ]]; then
     mkdir zip
fi
if [[ ! -d "postgres_data" ]]; then
     mkdir postgres_data
     docker-compose restart postgres
fi
while read line; do export "$line"; done < .env
echo "START"

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
scripts.template.js > web/dist/scripts/scripts.698e6068.js

cp driver-app.conf driver.conf
sed -i -e "s/HOST_NAME/${HOST_NAME}/g" \
	-e "s,    root \/opt\/web\/dist,    root $STATIC_ROOT\/web\/dist,g" \
	-e "s,STATIC_ROOT,$STATIC_ROOT,g" \
-e "s/driver-django/${DJANGO_HOST}/g" \
-e "s/driver-celery/${CELERY_HOST}/g" \
-e "s/windshaft/$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' windshaft-${CONTAINER_NAME})/g" \
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
fi
if [ $STATIC_ROOT != $WINDSHAFT_FILES ]; then
     sudo cp -r web "$STATIC_ROOT/"
     sudo cp -r static "$STATIC_ROOT/"
fi
sudo mv driver.conf /etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf
sudo service nginx restart
echo "Remember to run certbot now."
#docker-compose restart driver-nginx 
