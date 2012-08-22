// Filename: main.js
(function (require, document) {

    require([
        "app", // main application class
        "router", // Backbone router
        "appConfig" // MVC configuration
    ], function(app, Router, settings) {

        /**
         * version number (for caching)
         */
        var VERSION = undefined;
        
        // initialize application
        app.initialize(settings);

        // set template version (to enable caching)
        app.utils.templateLoader.setVersion(VERSION);

        // bootstrap the application 
        app.bootstrap(Router);

    });
}(window.require, window.document));

