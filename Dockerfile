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

COPY black_spots /opt/app/
COPY data /opt/app/
COPY driver /opt/app/
COPY driver_auth /opt/app/
COPY grout /opt/app/
COPY locale /opt/app/
COPY templates /opt/app/
COPY manage.py /opt/app/
COPY requirements.txt /opt/app/


RUN pip install --no-cache-dir gunicorn
RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "driver.wsgi", "-w3", "-b:4000", "-kgevent"]
