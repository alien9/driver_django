(function () {
    'use strict';

    // WARNING: This file is templated by ansible, any changes will be overridden on next provision
    // Modify this file in: `deployment/ansible/roles/driver.web/templates/editor-config-js.conf.j2`
    //
    // Note: This module is also mocked for Travis. If any changes are made to it, they should also
    // be made in: `schema_editor/test/mock/config.js`
    //
    // The web project loads the resources for this project, which includes this config.
    // The web app has its own config.js constant, which is why these are namespaced.

    var config = {
        debug: false,
        html5Mode: {
            enabled: false,
            prefix: '!'
        },
        api: {
            hostname: 'https://vidasegura.cetsp.com.br',
            // These group names are defined server-side in settings.py
            groups: {
                admin: 'admin',
                readOnly: 'public',
                readWrite: 'analyst'
            }
        }
    };

    angular.module('ase.config', [])
    .constant('ASEConfig', config);
})();
