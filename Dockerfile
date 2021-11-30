FROM python:3.8-buster

RUN set -ex && \
    apt-get update && \
    apt-get install -y --no-install-recommends libgdal-dev

RUN apt-get update && apt-get install -y \    
    gettext \
    libgeos-dev \
    libspatialindex-dev \
    gdal-bin \
    postgis

RUN ["gdal-config", "--version"]

RUN mkdir -p /opt/app

WORKDIR /opt/app

COPY black_spots /opt/app/black_spots
COPY data /opt/app/data
COPY driver /opt/app/driver
COPY driver_auth /opt/app/driver_auth
COPY grout /opt/app/grout
COPY vida /opt/app/vida
COPY locale /opt/app/locale
COPY templates /opt/app/templates
COPY user_filters /opt/app/user_filters
COPY manage.py /opt/app/
COPY requirements-production.txt /opt/app/requirements.txt
COPY find_segments.sql /opt/app/find_segments.sql
COPY web /opt/app/web/dist



RUN pip install --no-cache-dir gunicorn
RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "driver.wsgi", "-w3", "-b:4000", "-kgevent", "--timeout", "4000"]
