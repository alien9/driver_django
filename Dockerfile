FROM python:3.8-buster

RUN set -ex && \
    apt-get update && \
    apt-get install -y --no-install-recommends libgdal-dev

RUN apt-get update && apt-get install -y \    
    gettext \
    libgeos-dev \
    libspatialindex-dev \
    gdal-bin \
    postgis \
    libsqlite3-mod-spatialite
RUN ["gdal-config", "--version"]

RUN mkdir -p /opt/app
RUN mkdir -p /opt/app/web


WORKDIR /opt/app

COPY black_spots /opt/app/black_spots
COPY data /opt/app/data
COPY driver /opt/app/driver
COPY driver_auth /opt/app/driver_auth
COPY grout /opt/app/grout
COPY locale /opt/app/locale
COPY templates /opt/app/templates
COPY user_filters /opt/app/user_filters
COPY manage.py /opt/app/
COPY requirements-production.txt /opt/app/requirements.txt
COPY find_segments.sql /opt/app/find_segments.sql
COPY angular/driver/dist/driver /opt/app/web/
COPY favicon.ico /opt/app/driver/favicon.ico
COPY crontab /opt/app/driver/crontab
COPY static /opt/app/static

RUN pip install --no-cache-dir gunicorn
RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "driver.wsgi", "-w3", "-b:4000", "-kgevent", "--timeout", "4000"]

