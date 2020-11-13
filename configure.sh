#!/bin/bash

if [[ ! -d "nginx" ]]; then
     mkdir nginx
fi
while read line; do export "$line"; done < .env
echo "START"

while read line; do echo "$line"; done < .env

echo ${CONTAINER_NAME}
LANGUAGES=$(tr \' " " <<<"$LANGUAGES")
sed -e "s/PROTOCOL/${PROTOCOL}/g" \
     -e "s/HOST_NAME/${HOST_NAME}/g" \
     -e "s/TIMEZONE/${TIMEZONE}/g" \
     -e "s/NOMINATIM/${NOMINATIM}/g" \
     -e "s/PRIMARYLABEL/${PRIMARYLABEL}/g" \
     -e "s/SECONDARYLABEL/${SECONDARYLABEL}/g" \
     -e "s/CLIENTID/${CLIENTID}/g" \
     -e "s/COUNTRY/${COUNTRY}/g" \
     -e "s/CENTER/${CENTER}/g" \
     -e "s/ZOOM/${ZOOM}/g" \
     -e "s/LANGUAGES/${LANGUAGES}/g" \
scripts.template.js > web/dist/scripts/scripts.698e6068.js
cp driver-app.conf nginx/driver.conf
sed -i -e "s/HOST_NAME/${HOST_NAME}/g" \
	-e "s,    root \/opt\/web\/dist,    root $WINDSHAFT_FILES\/web\/dist,g" \
-e "s/driver-django/$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-django-${CONTAINER_NAME})/g" \
-e "s/driver-celery/$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-celery-${CONTAINER_NAME})/g" \
-e "s/windshaft/$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' windshaft-${CONTAINER_NAME})/g" \
nginx/driver.conf

#docker exec driver-nginx sed -i -e "s/HOST_NAME/${HOST_NAME}/g" /etc/nginx/conf.d/driver-app.conf

if [ $PROTOCOL == "http" ]
then
     echo "HTTP"
else
     echo "HTTPS"
 #    docker exec driver-nginx certbot
fi
docker exec "driver-django-${CONTAINER_NAME}" ./manage.py collectstatic --noinput
docker exec "driver-django-${CONTAINER_NAME}" ./manage.py migrate

sudo mv nginx/driver.conf /etc/nginx/sites-enabled/driver-${CONTAINER_NAME}.conf
sudo service nginx restart
#docker-compose restart driver-nginx 
