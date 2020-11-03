This project is deployed with docker containers. 

## Environment

You must define the constant values in the `.env` file. A template `.env.sample` is provided, and it contains the keys and values needed for DRIVER to run.

In the project directory, you can run:

`docker-compose up -d`

The 443 and 80 ports are required in the host in order to receive and process requests. Ensure the proper name server settings to direct the requests to the nginx container, which will provide the web interface. 

These are first-run commands to prepare the database and web server to run the system:

`docker exec driver-django ./manage.py collectstatic`  
`docker exec driver-django ./manage.py migrate`  
`docker exec driver-nginx certbot renew`


## Development Environment

Postgresql

`python3 -m venv venv`  
`source venv/bin/activate`  
`pip install -r requirements.txt`  
`python manage.py runserver`  

## Requirements

Python 3.8.5; PostgreSQL 9.4; GDAL 2.4.1; PostGIS 2.5
