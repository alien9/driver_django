docker rm $(docker ps -aqf "name=windshaft")
/usr/bin/docker run \
  --name windshaft \
  --network=host \
  --publish 5000:5000 \
  --volume /home/tiago/works/driver_django/windshaft/driver.js:/opt/windshaft/driver.js \
  --volume /home/tiago/works/driver_django/windshaft/healthCheck.js:/opt/windshaft/healthCheck.js \
  --volume /home/tiago/works/driver_django/windshaft/alphamarker.png:/opt/windshaft/alphamarker.png \
  --volume /home/tiago/works/driver_django/windshaft/server.js:/opt/windshaft/server.js \
  --env DRIVER_DB_NAME='driver3' \
  --env DRIVER_DB_USER='driver' \
  --env DRIVER_DB_PASSWORD='driver' \
  --env WINDSHAFT_DB_USER='driver' \
  --env WINDSHAFT_DB_PASSWORD='driver' \
  --env DRIVER_DB_HOST='localhost' \
  --env DRIVER_DB_PORT='5432' \
  --env DRIVER_APP_HOST='http://titopop/' \
  --env DRIVER_REDIS_HOST='localhost' \
  --env DRIVER_REDIS_PORT='6379' \
  --log-driver syslog \
  quay.io/azavea/windshaft:0.1.0 server.js
