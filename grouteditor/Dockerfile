FROM node:12-buster

WORKDIR /opt/driver/
COPY src /opt/driver/src
COPY e2e /opt/driver/
COPY angular.json /opt/driver/angular.json
COPY karma.conf.js /opt/driver/
COPY package.json /opt/driver/
COPY tsconfig.app.json /opt/driver/
COPY tsconfig.json /opt/driver/
COPY tsconfig.spec.json /opt/driver/
COPY tslint.json /opt/driver/


RUN n | npm i -g @angular/cli@12.2.18
RUN npm update
RUN npm install -g --save-dev @angular-devkit/build-angular
RUN npm install
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]