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

Python 3.8.5; PostgreSQL 9.4; GDAL 2.4.1; PostGIS 2.5
