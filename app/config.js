// Set the require.js configuration for your application.
require.config({

    // Initialize the application with the main application file.
    deps: ["main"],

    paths: {
        // JavaScript folders.
        libs: "../js/libs",
        plugins: "../js/plugins",
        vendor: "../vendor",

        // Libraries.
        jquery: "../js/libs/jquery.min",
        lodash: "../js/libs/lodash.min",
        backbone: "../js/libs/backbone.min",
        bootstrap: "../js/libs/bootstrap",
        handlebars: "../js/libs/handlebars",
        icanhaz: "../js/libs/icanhaz"
    },

    shim: {
        // Backbone library depends on lodash and jQuery.
        jquery: {
            exports: 'jQuery'
        },

        backbone: {
            deps: ["lodash", "jquery"],
            exports: "Backbone"
        },
        
        bootstrap: {
            deps: ['jquery']
        },
        
        handlebars: {
            exports: "Handlebars"
        },
        
        icanhaz: {
            exports: "ich"
        },

        // Backbone.LayoutManager depends on Backbone.
        "plugins/backbone.layoutmanager.min": ["backbone"],
        "plugins/backbone.layoutmanager": ["backbone"],
        
        // Backbone.LocalStorage depends on Backbone.
        "plugins/backbone.localStorage.min": ["backbone"],
        "plugins/backbone.localStorage": ["backbone"]
        
    }

});
