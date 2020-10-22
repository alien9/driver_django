This project is deployed with docker containers. 

## Environment

You must define the constant values in the `.env` file. A sample `.env.sample` is provided, and it contains the keys needed for DRIVER to run.

In the project directory, you can run:

`docker-compose up -d`

The 443 and 80 ports are required in the host in order to receive and process requests. Ensure the proper name server settings to direct the requests to the nginx container, which will provide the web interface. 

These are first-run commands to prepare the database and web server to run the system:

`docker exec driver-django collectstatic  
docker exec driver-django ./manage.py migrate  
docker exec driver-nginx certbot renew  `

## Development Environment

## Requirements

Python 3.8.5; PostgreSQL 9.4

