
(function () {
    'use strict';

    // WARNING: This file is templated by ansible, any changes will be overridden on next provision
    // Modify this file in: `deployment/ansible/roles/driver.web/templates/web-config-js.conf.j2`
    //
    // Note: This module is also mocked for Travis. If any changes are made to it, they should also
    // be made in: `web/test/mock/config.js`
    //
    // The schema editor project resources loaded by this project also include
    // a config constant, which is why these are namespaced.

    var config = {
        debug: false,
        html5Mode: {
            enabled: false,
            prefix: '!'
        },
        api: {
            hostname: 'https://malawi.roadsafetysa.com'
        },
        windshaft: {
            hostname: 'https://malawi.roadsafetysa.com'
        },
        nominatim: {
            key: 'NmfGZYebsExMYfFWP4Tf'
        },
        record: {
            limit: 50
        },
        blackSpots: {
            visible: true
        },
        heatmap: {
            visible: true
        },
        interventions: {
            visible: false
        },
        recordType: {
            visible: false,
            primaryLabel: 'Accident',
            secondaryLabel: 'Intervention'
        },
        localization: {
            timeZone: 'Africa/Blantyre',
            countryCode: 'mw',
            centerLatLon: [-13.0, 34.2],
            /*jshint quotmark: double */
            languages: [{"id": "en-us", "label": "English", "rtl": false}]
            /*jshint quotmark: single */
        },
        mapillary: {
            enabled: false,
            clientId: '',
            range: 10
        },
        filters: {
            weather: {
                visible: false
            },
            createdBy: {
                visible: false
            },
            createdDate: {
                visible: false
            },
        },
        qualityChecks: {
            outsideBoundary: {
                visible: false
            },
        },
        addressSearch: {
            visible: false
        },
        duplicateRecordsLink: {
            visible: true
        }
    };

    angular.module('driver.config', [])
    .constant('WebConfig', config);
})();
