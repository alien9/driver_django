This project is deployed with docker containers. 

## Environment

You must define the constant values in the `.env` file. A template `.env.sample` is provided, and it contains the keys and values needed for DRIVER to run.

In the project directory, you can run:

`docker-compose up -d`

There are 5 containers running as daemons in order to make DRIVER available.
The nginx server is set up at the host in the standard mode. 



## Development Environment

Postgresql

`python3 -m venv venv`  
`source venv/bin/activate`  
`pip install -r requirements.txt`  
`python manage.py runserver`  

## Requirements

Python 3.8.5; PostgreSQL 9.4; GDAL 2.4.1; PostGIS 2.5; node v12.22.12; npm 6.14.16

## AngularJS front-end

./angular/driver

For dev environment, run:

npm install --save
ng serve

npm run extract-translations

Front-end build: see angular/driver/README.md

The dictionaries will be stored at ./angular/driver/src/assets/i18n
To create a new language, include its code as an empty json file; this must match a dictionary created in the back-end to provide the option to the language.

## Building the front-end app

See angular/driver/README.md

## Deployment

### Prerequisites

The solution will run on Ubuntu 20.04. The prerequisites are 

- PostgreSQL 13.3
- docker-composer
- nginx web server
- letsencrypt plugin (for SSL)


The domain name must be set with an 'A' registry into the registrar's DNS to point to the server.
Prepare the database cluster with proper permissions to the intended role in order to get the Django migrations working. This is usually done with the following copmmands at the psql shell:

`create database <database_name>; create user <user_name> with password '<password>'; grant all on database <database_name> to <user_name>`

`\c <database_name>`

`create extension postgis. create extension hstore; create extension "uuid-ossp";`

The _database_name_, _user_name_ and _password_ must be set in an .env file at deployment directory.

Copy the files docker_compose.yml, configure.sh, driver-app.conf to the server.

The .env must conytain the following parameters:
`
HOST_NAME=<domain_name>
PROTOCOL=https # for ssl 
STATIC_ROOT=<absolute_path_where_you_placed_the_files>
CLIENTID=<google_client_id>
CLIENT_SECRET=<google_client_secret>
TIMEZONE=America/La_Paz
NOMINATIM=<nominatim_key>
PRIMARYLABEL=<label_record_type>
SECONDARYLABEL=<intervention_name>
COUNTRY_CODE=<country_code>
CENTER_LATITUDE=<latitude>
CENTER_LONGITUDE=<longitude>
ZOOM=11
LANGUAGES='[{id: "pt-br", label:"Português", rtl: !1},{id: "es",label: "Español", rtl: !1},{id: "en-us", label: "English", rtl: !1}]'
DATABASE_PASSWORD=<database_password>
DRIVER_ADMIN_PASSWORD=<admin_password>
CONTAINER_NAME=<container_name>
DATABASE_NAME=<database_name>
DATABASE_USERNAME=<database_username>
DATABASE_PASSWORD=<database_password>
DATABASE_HOST=<database_host>
`

run

`docker-compose up -d`

`./configure.sh`

`sudo certbot`

and follow the instructions for generating an SSL certifdicate for the domain name.

Log into <domain_name>/admin for additional configurations.
