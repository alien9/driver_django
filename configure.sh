#!/bin/bash

while read line; do export "$line"; done < .env
echo "START"
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

docker exec driver-nginx sed -i -e "s/HOST_NAME/${HOST_NAME}/g" /etc/nginx/conf.d/driver-app.conf

if [ $PROTOCOL == "http" ]
then
     echo "HTTP"
else
     echo "HTTPS"
     docker exec driver-nginx certbot renew
fi
docker exec driver-django ./manage.py collectstatic --noinput
docker exec driver-django ./manage.py migrate

docker-compose restart driver-nginx 