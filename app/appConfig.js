// Filename: appConfig.js

define([
    'includes/views',
    'includes/models',
    'includes/collections'
], function (views, models, collections) {
    
    /**
     * Application configuration
     */
    var appConfig = {
        root: '/', // application root
        name: 'Boilerplate Application', // application name
        dataStore: { // Data store REST service
            baseUrl: '', // base URL
            endpoint: '', // REST endpoint
            dataType: '' // data type for AJAX response (eg. "json" / "jsonp")
            //localStorage: true // uncomment for localStorage
        },
        selectors: { // jQuery selectors
            page: '#root', // layout
            menu: '#menu', // menu
            sections: 'section.page', // sections
            defaultSection: '#home' // default section 
        },
        layoutSettings: {
            name: 'page', // layout name
            template: {
                template: 'page', // template name
                css: [] // required CSS files (without .css extension)
            },
            content: 'page-content' // content element ID
        },
        utils: {
            templateLoader: {
                settings: {
                    path: 'templates/' // template directory (relative to index.html)
                }
            },
            analytics: { // google analytics tracking
                settings: { // Google Analytics settings, @see https://developers.google.com/analytics/devguides/collection/gajs/methods/
                    _setAccount: 'UA-17371882-2'
                }
            }
        },
        views: views, // includes/views.js
        models: models, // includes/models.js
        collections: collections // includes/collections.js
    };

    return appConfig;
    
});