FROM node:12-buster

WORKDIR /opt/driver/
RUN n | npm i -g @angular/cli@12.2.18
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]