# Driver

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


Run `npm run extract-translations`  to compile the dictionaries from newly translated terms.

The dictionaries will be stored at `./angular/driver/src/assets/i18n`.

To create a new language, include its code name as an empty file at

`./angular/driver/src/assets/i18n/<lang_code>.json`
and run `npm run extract-translations` to generate the dictionary scaffold.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

Example build for production:

`ng build --prod --base-href /alpha/ --deploy-url /alpha/ --output-url=../../web`


and then, served by nginx as:

    location /alpha {
        alias <project_location>/driver_django/angular/driver/dist/driver; 
        index index.html;
        try_files $uri $uri/ =404;
    } 


## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
