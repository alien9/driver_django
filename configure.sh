#!/bin/bash

docker compose up -d
if [[ ! -d "zip" ]]; then
     mkdir zip
fi

while read line; do export "$line"; done < .env

while read line; do echo "$line"; done < .env
if [ $HOST_NAME=="" ]; then
     HOST_NAME=$(ip route get 8.8.8.8 | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
     
fi
echo "preparing for $HOST_NAME"
echo ${CONTAINER_NAME}

EXISTE_DJANGO=$(docker ps | grep driver-django-${CONTAINER_NAME})
EXISTE_CELERY=$(docker ps | grep driver-celery-${CONTAINER_NAME})
DJANGO_HOST="localhost"
#if [ "${EXISTE_DJANGO}" != "" ]; then
#     DJANGO_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-django-${CONTAINER_NAME})
#fi
CELERY_HOST="localhost"
#if [ "${EXISTE_CELERY}" != "" ]; then
#     CELERY_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' driver-celery-${CONTAINER_NAME})
#fi
if [ "${PROTOCOL}" == "" ]; then
     PROTOCOL='http'
fi
if [ -d "static" ]; then
     sudo rm -rf static/*
fi
echo "backend is ${BACKEND}"
if [ "${USE_LOCALHOST}" != "1" ]; then
echo "export const environment = {
  production: false,
  api: '${BACKEND}',
};
" >angular/driver/src/environments/environment.dev.ts
else
     rm angular/driver/src/environments/environment.dev.ts -f
fi
STATIC_ROOT=$(pwd)/static/

if [ $SUPRESS_WEB_DEPLOY ]; then # with development web server
     export FRONTEND="    location / {
        proxy_set_header Host \$http_host;
        proxy_pass http://$HOST_NAME:4201;
        proxy_read_timeout 40s;
        proxy_redirect     off;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
    }    
    location /static/{
        proxy_pass http://$HOST_NAME:4000; #driver-django
        proxy_read_timeout 40s;
        proxy_redirect     off;
        proxy_set_header   Host \$http_host;
        proxy_set_header   X-Forwarded-Host \$host;
        proxy_set_header   X-Forwarded-Server \$host;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
    }
    location /media/{
        proxy_pass http://$HOST_NAME:4000; #driver-django
        proxy_read_timeout 40s;
        proxy_redirect     off;
        proxy_set_header   Host \$http_host;
        proxy_set_header   X-Forwarded-Host \$host;
        proxy_set_header   X-Forwarded-Server \$host;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
    }
    location /sockjs-node/ {

          proxy_pass http://$HOST_NAME:8081;
          proxy_http_version 1.1;
          proxy_set_header Upgrade \$http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_read_timeout 86400;

     }
    "
else
     export FRONTEND="    location / {
     autoindex on;
        alias $STATIC_ROOT; #FRONTEND
        try_files \$uri \$uri/ =404;
    }
    location /login {
        alias $STATIC_ROOT; #FRONTEND
        try_files \$uri \$uri/ =404;
    }
    location /static/{
        alias $STATIC_ROOT; #FRONTEND
        try_files \$uri \$uri/ =404;
    }

    location /favicon.ico {
        alias $STATIC_ROOT/static/web/favicon.ico; #FAVICON
    }"

fi
echo $FRONTEND

#if [[ ! -f driver-${CONTAINER_NAME}.conf ]]; then
cp driver.conf driver-${CONTAINER_NAME}.conf
#fi
sed -i -e "s/\s[^ ]*\s*#HOST_NAME$/ ${HOST_NAME}; #HOST_NAME/g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT$, ${STATIC_ROOT}; #STATIC_ROOT,g" \
-e "s,\s[^ ]*\s*#STATIC_ROOT_MEDIA$, ${STATIC_ROOT}/zip/; #STATIC_ROOT_MEDIA,g" \
-e "s/http.*#driver-django$/http:\/\/${DJANGO_HOST}:4000; #driver-django/g" \
-e "s,\s[^ ]*\s*#ALPHA_ROOT$, ${ALPHA_ROOT}; #ALPHA_ROOT,g" \
-e "s,\s[^ ]*\s*#FAVICON$, ${STATIC_ROOT}/favicon.ico; #FAVICON,g" \
driver-${CONTAINER_NAME}.conf

echo "$FRONTEND" >>  driver-${CONTAINER_NAME}.conf
echo "}" >> driver-${CONTAINER_NAME}.conf
#docker exec driver-nginx sed -i -e "s/HOST_NAME/${HOST_NAME}/g" /etc/nginx/conf.d/driver-app.conf

if [ $PROTOCOL == "http" ]
then
     echo "HTTP"
else
     echo "HTTPS"
 #    docker exec driver-nginx certbot
fi
[ -e "./static/*" ] && sudo rm ./static/*
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
     docker compose up -d
     #docker cp "driver-django-${CONTAINER_NAME}":/opt/web/dist static/
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
sudo systemctl restart nginx

#docker-compose restart driver-nginx 
