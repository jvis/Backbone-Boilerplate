// Filename: app.js
define([
    'jquery', 
    'backbone', 
    'lodash', 
    'icanhaz', //'handlebars', // supports Handlebars.JS templates also
    'plugins/backbone.layoutmanager', 
    //'plugins/backbone.localStorage.min',
    'bootstrap'
], function ($, Backbone, _, ich) {
    
    /**
     * Application class
     */
    var Application = function (opts) {

        var app = {
            init: false,

            models: {},

            collections: {},

            views: {},

            utils: {},

            container: {},

            initialize: function (opts) {
                if (!this.init) {
                    $.extend(true, this, opts || {}, Backbone.Events);

                    var self = this;
                    
                    // override sync function
                    if (!this.sync) {
                        this.sync = Backbone.sync;
                    }
                    
                    Backbone.sync = function (method, model, options) { 
                        // if dataType set, override Backbone.sync function with correct datatype
                        if ((!options || (options && !options.dataType)) && 
                                self.dataStore && self.dataStore.dataType) {   
                            options = $.extend(options || {}, {
                                dataType: self.dataStore.dataType
                            });
                        }
                        return self.sync(method, model, options);
                    };
                    
                    // build MVC structure
                    this.utils.mvcBuilder.buildMvc(opts, this);
                    
                    // set initialized flag to opts
                    this.init = opts;
                }
                return this;
            },

            // Helper for using layouts.
            useLayout: function (name, opts, render) {
                // If already using this Layout, then don't re-inject into the DOM.
                if (this.layout && this.layout.options.template === name) {
                    return this.layout;
                }

                // If a layout already exists, remove it from the DOM.
                if (this.layout) {
                    this.layout.remove();
                }

                // Create a new Layout.
                var layout = new Backbone.Layout($.extend({}, {
                    className: "layout",

                    id: name
                }, opts || {}));
                // Insert into the DOM.
                $(app.selectors[name]).empty().append(layout.el);

                // Render the layout.
                if (render !== false) {
                    layout.render();
                }

                // Cache the refererence.
                this.layout = layout;

                // Return the reference, for chainability.
                return layout;
            },
            
            /**
             * Navigation helper
             * 
             * @see http://backbonejs.org/#Router-navigate
             */
            navigate: function (route, data) {
                return this.router.navigate(route, data);
            },
            
            log: function (msg) {
                if (console && console.log) {
                    console.log(msg);
                }
            }
        };

        // Configure LayoutManager
        Backbone.LayoutManager.configure({
            // Manage variable set on base view
            manage: false,

            fetch: function(path) {
                // Put fetch into `async-mode`.
                var done = this.async();

                // load layout using templateLoader
                app.utils.templateLoader.load([path], function () {
                    if (typeof(path) === 'object') {
                        path = path.template;
                    }
                    done(app.utils.templateLoader.getTemplate(path));
                });
            }
        });
        
        // add close function to view
        Backbone.View.prototype.close = function () {
            this.remove();
            this.unbind();
            this.cleanup();
            if (this.onClose) {
                this.onClose();
            }
            return this;
        }

        /**
         * utilities
         */
		 
        // analytics handler
        app.utils.analytics = {
            // initialize google analytics tracking
            initialize: function () {
                window._gaq = window._gaq || [];

                if (!this.init && this.settings) {
                    // add GA init parameters, eg. '_setAccount'
                    $.each(this.settings, function (index, value) {
                        window._gaq.push([index, value]);
                    });

                    var ga = document.createElement('script');
                    ga.type = 'text/javascript';
                    ga.async = true;
                    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                    var s = document.getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(ga, s);

                    this.init = true;
                }

                return window._gaq;
            },

            // track pageview
            // @see https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration#_gat.GA_Tracker_._trackPageview
            trackPageview: function (pageUrl) {
                if (typeof(pageUrl) === 'string') {
                    if (pageUrl.length > 1 && pageUrl[pageUrl.length - 1] == "/") {
                            pageUrl = pageUrl.substring(0, pageUrl.length - 1);
                    }
                    if (pageUrl[0] != "/") {
                            pageUrl = "/" + pageUrl;
                    }
                    this.initialize().push(['_trackPageview', pageUrl]);
                }
                else {
                    this.initialize().push(['_trackPageview']);
                }
                return this;
            },

            // track event
            // @see https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEventTracking#_gat.GA_EventTracker_._trackEvent
            trackEvent: function (category, action, label, value, noninteraction) {
                var event = ['_trackEvent'];
                if (!(category && action)) {
                    return this;
                }
                event.push(category);
                event.push(action);
                if (label) event.push(label);
                if (!isNaN(value)) event.push(value);
                if (typeof(noninteraction) === 'boolean') event.push(noninteraction);
                this.initialize().push(event);
                return this;
            },

            // bind event tracking to JQuery element
            bindTracking: function($elem, event, category, value, attr, single) {
                var self = this,
                method = "on";

                // track only the first event trigger?
                if (single) {
                    method = "one";
                }

                $elem[method](event, function() {
                    self.trackEvent(category, event, (value ? value : (attr ? $elem.attr(attr) : null)));
                });

                return this;
            }
        };
        
        // local storage handler
        app.utils.localStorage = {
            stores: {},
            
            get: function (name) {
                if (!this.stores.hasOwnProperty(name)) {
                    this.stores[name] = new Backbone.LocalStorage(name);
                }
                return this.stores[name];
            }
        };
        
        // MVC builder
        app.utils.mvcBuilder = {
            // set MVC container (eg. "app" object)
            setContainer: function (container) {
                this.container = container;
                return this;
            },

            // get MVC container (eg. "app" object)
            getContainer: function () {
                if (!this.container) {
                    this.container = {
                        models: {},
                        views: {},
                        collections: {}
                    };
                }
                return this.container;
            },

            // build MVC structure into container
            buildMvc: function (config, container) {
                if (container) {
                    this.setContainer(container);
                }
                
                this.buildModels(config.models || {});
                this.buildCollections(config.collections || {});
                this.buildViews(config.views || {});
                
                return this.getContainer();
            },

            // create models
            buildModels: function(models, base) {
                var self = this,
                container = this.getContainer();

                if (typeof(base) === 'undefined') {
                    base = container.models.base || Backbone.Model;
                }

                if (models) {
                    $.each(models, function(index, model) {
                        model = $.extend(true, {
                            name: index
                        }, model);

                        // create model
                        if (model.base) {
                            var currentBase = model.base; 
                            delete model.base;
                            if (typeof(currentBase) === 'string') {
                                currentBase = container.models[currentBase]
                            }
                        }
                        container.models[index] = currentBase ? currentBase.extend(model) : base.extend(model);

                        // create views
                        self.buildViews(model.views || {}, {model: container.models[index]});

                        // create collections
                        self.buildCollections(model.collections || {}, container.models[index], container.collections.base);

                        // create child models
                        self.buildModels(model.models || {}, container.models[index]);
                    });
                }
                return this;
            },

            // create collections
            buildCollections: function(collections, model, base) {
                var self = this,
                container = this.getContainer();

                if (typeof(base) === 'undefined') {
                    base = container.collections.base || Backbone.Collection;
                }

                if (collections) {
                    $.each(collections, function(index, collection) {
                        collection = $.extend(true, {
                            name: index,
                            model: model
                        }, collection);

                        // create collection
                        if (collection.base) {
                            var currentBase = collection.base; 
                            delete collection.base;
                            if (typeof(currentBase) === 'string') {
                                currentBase = container.collections[currentBase]
                            }
                        }
                        container.collections[index] = currentBase ? currentBase.extend(collection) : base.extend(collection);

                        // create view
                        self.buildViews(collection.views || {}, {collection: container.collections[index]});

                        // create child collections
                        self.buildCollections(collection.collections || {}, model, container.collections[index]);
                    });
                }
                return this;
            },

            // create views
            buildViews: function(views, object, base) {
                var self = this,
                container = this.getContainer();

                if (typeof(base) === 'undefined') {
                    base = container.views.base || Backbone.View;
                }

                if (views) {
                    $.each(views, function(index, view) {
                        view = $.extend(true, {
                            name: index
                        }, view, object);
                        
                        // child views
                        var children = view.views;
                        delete view.views; // required to avoid conflict with LayoutManager
                         
                        // create view
                        if (view.base) {
                            var currentBase = view.base; 
                            delete view.base;
                            if (typeof(currentBase) === 'string') {
                                currentBase = container.views[currentBase]
                            }
                        }
                        container.views[index] = currentBase ? currentBase.extend(view) : base.extend(view);

                        // create child views
                        self.buildViews(children, object, container.views[index]);
                    });
                }
                return this;
            }
        };
        
        // asynchronous template loader
        app.utils.templateLoader = { 

            settings: {
                extension: '.html',
                cssPath: 'css/',
                dataType: 'html'
            },

            deferreds: {},

            callbacks: {},

            stylesheets: {},

            templates: ich ? ich.templates : {},

            // set template version
            // will be appended to URL
            setVersion: function (version) {
                if (typeof(version) === 'undefined' || version === false) {
                    this.cache = undefined;
                }
                else if (!isNaN(version)) {
                    this.cache = '?v=' + encodeURIComponent(version);
                }
                return this;
            },

            getTemplate: function (name) {
                return ich ? ich[name] : (this.templates[name] ? this.templates[name] : function() {});
            },

            // create callback function
            templateCallback: function (name) {
                var self = this;
                return function (data) { // pipe template to callbacks
                    if (! (name in self.templates)) {
                        if (ich) { // if using ICanHaz.JS
                            ich.addTemplate(name, data);
                        }
                        else if (Handlebars) { // if using Handlebars.js
                            self.templates[name] = Handlebars.compile(data) // compile template
                        }
                        else { // unknown template engine
                            self.template[name] = data;
                        }
                    }
                    return self.templates[name];
                }
            },

            // create JSONP callback
            // NB: by not relying on jQuery generated callback, 
            //     we can cache response using standard browser cache
            jsonpCallback: function (name) {
                var callback = '_templateLoader_'+name.replace(/\W/g, ''),
                self = this;

                if (!(callback in this.callbacks)) {
                    window[callback] = this.templateCallback(name);
                    this.callbacks[callback] = true;
                }

                return callback;
            },

            // load template
            load: function(names, callback) {
                var self = this;

                $.each(names, function (index, name) {
                    var css = [];
                    if (typeof(name) === 'object') {
                        css = name.css || [];
                        name = name.template || null;
                    }

                    // add any necessary stylesheets
                    $.each(css, function (index, name) {
                        self.addStylesheet(self.settings.cssPath + name + 
                            '.css' + (self.cache ? self.cache: ''));
                    });

                    // if template doesn't already exist and isn't currently being loaded
                    if (! ((name in self.templates) || (name in self.deferreds))) { 
                        var ajax = {
                            dataType: self.settings.dataType
                        };
                        if (ajax.dataType == 'jsonp') {
                            ajax.jsonpCallback = self.jsonpCallback(name);
                        }
                        else {
                            ajax.success = self.templateCallback(name);
                        }
                        // create deferred AJAX object
                        self.deferreds[name] = $.ajax($.extend({
                            url: self.settings.path + name + 
                            self.settings.extension + (self.cache ? self.cache: ''),
                            cache: (self.cache ? true : false)
                        }, ajax)).done(callback).always(function () {
                            delete self.deferreds[name];
                        });
                    }
                    else if (name in self.deferreds) { // if template is currently being loaded?
                        self.deferreds[name].done(callback);
                    }
                    else if ((name in self.templates) && callback) { // template already exists
                        callback();
                    }
                });
            },

            // Render template
            render: function (name, data, callback) { 
                var self = this;
                this.load([name], function () {
                    return callback(self.getTemplate(name)(data));
                });
            },

            // Add stylesheet
            addStylesheet: function (href) {
                if (!this.stylesheets.hasOwnProperty(href)) {
                    if (document.createStyleSheet) {
                        this.stylesheets[href] = document.createStyleSheet(href);
                    }
                    else {
                        var $el = $('<link type="text/css" rel="stylesheet" />').attr('href', href);
                        $('head').append($el);
                        this.stylesheets[href] = $el;
                    }
                }
                return this.stylesheets[href];
            }
        };

        /**
         * base classes
         */
        app.models.base = Backbone.Model.extend({
            initialize: function () {
                $.extend(this, app.dataStore || {});
                
                if (this.localStorage === true) { // if localStorage enabled, get adapter
                    this.localStorage = app.utils.localStorage.get(this.getName());
                }
                
                return this;
            },

            /**
             * @see http://backbonejs.org/#Model-urlRoot
             */
            urlRoot: function () {
                if (this.baseUrl && this.endpoint && this.resource) {
                    return this.baseUrl + this.endpoint + this.resource;
                }
                else if (Backbone.Model.prototype.urlRoot) {
                    return Backbone.Model.prototype.urlRoot.call(this);
                }
            },

            getName: function () {
                return this.name;
            }
        });
        app.collections.base = Backbone.Collection.extend({
            initialize: function() {
                $.extend(this, app.dataStore || {});
                
                if (this.localStorage === true) { // if localStorage enabled, get adapter
                    this.localStorage = app.utils.localStorage.get(this.getName());
                }
                
                return this;
            },

            /**
             * @see http://backbonejs.org/#Collection-url
             */
            url: function () {
                if (this.baseUrl && this.endpoint && this.resource) {
                    return this.baseUrl + this.endpoint + this.resource;
                }
                else if (Backbone.Collection.prototype.url) {
                    return Backbone.Collection.prototype.url.call(this);
                }
            },

            getName: function () {
                return this.name;
            }
        });
        app.views.base = Backbone.View.extend({
            // allow layout manager to handle view
            manage: true,
            
            initialize: function () {
                if (this.model) {
                    if ($.isFunction(this.model)) {
                        this.model = new this.model();
                    }
                    this.setModel(this.model);
                }
                if (this.collection) {
                    if ($.isFunction(this.collection)) {
                        this.collection = new this.collection();
                    }
                    this.setCollection(this.collection);
                }
                return this;
            },

            setModel: function (model) {
                // remove existing events
                if (this.model && this.model.off) {
                    this.model.off(null, null, this);
                }
                
                this.model = model;
                if (model && this.model.on) {
                    this.model.on('change', this.render, this);
                }
                return this;
            },

            setCollection: function (collection) {
                // remove existing events
                if (this.collection && this.collection.off) {
                    this.collection.off(null, null, this);
                }
                this.collection = collection;
                if (collection && this.collection.on) {
                    this.collection.on('reset', this.render, this);
                    this.collection.on('add', this.onCollectionAdd, this);
                    this.collection.on('remove', this.onCollectionRemove, this);
                }
                return this;
            },
            
            attributes: function () {
                var attrs = {};
                if (this.model && this.model.constructor) {
                    var name = this.model.constructor.prototype.name;
                    
                    if (name) {
                        attrs['class'] = name;
                        
                        if (this.model.collection) {
                            var index = this.model.collection.indexOf(this.model);
                            
                            attrs['class'] += ' ' + name + '-' + index;
                            
                            if (index == 0) {
                                attrs['class'] += ' first';
                            }
                            
                            if (index % 2 == 0) {
                                attrs['class'] += ' even';
                            }
                            else {
                                attrs['class'] += ' odd';
                            }
                        }
                        
                        if (this.model.id) {
                            attrs['id'] = name + '-' + new String(this.model.id).replace(/[^a-z0-9]/g, '');
                        }
                    }
                }
                return attrs;
            },

            /**
             * Insert all subViews prior to rendering the View.
             * 
             * @https://github.com/tbranyen/backbone.layoutmanager#beforerender-function
             */
            beforeRender: function () {
                if (this.collection) {
                    // Iterate over the passed collection and create a view for each item.
                    var iterator = function (item, index) {
                        this.onCollectionAdd(item, this.collection, {
                            render: false,
                            index: index
                        });
                    };
                    this.collection.each ? this.collection.each(iterator, this) : _.each(this.collection, iterator, this);
                }
            },
            
            /**
             * Add event - triggered when item added to collection
             */
            onCollectionAdd: function (item, collection, options) {
                if (item) {
                    var cls = app.views.base || Backbone.View;
                    if (item.constructor && (name = item.constructor.prototype.name) && (name in app.views)) {
                        cls = app.views[name];
                    }
                    var view = new cls({
                        model: item
                    });
                    this.insertView(view);

                    if (!options || options.render !== false) {
                        view.render();
                    }
                }
                return this;
            },
            
            /**
             * Remove event - triggered when item removed from collection
             */
            onCollectionRemove: function (item) {
                if (item) {
                    var view = this.getView(function (view) {
                        return view.model === item;
                    });
                    if (view) {
                        view.remove();
                    }
                }
                return this;
            },
            
            /**
             * @see https://github.com/tbranyen/backbone.layoutmanager#cleanup-function
             */
            cleanup: function() {
                if (this.model && this.model.off) {
                    this.model.off(null, null, this);
                }
                if (this.collection && this.collection.off) {
                    this.collection.off(null, null, this);
                }
                app.off(null, null, this);
                return this;
            },
            
            /**
             * @see https://github.com/tbranyen/backbone.layoutmanager#working-with-template-data
             */
            serialize: function () {
                if (this.model && this.collection) {
                    return {
                        model: this.model.toJSON ? this.model.toJSON() : this.model,
                        collection: this.collection.toJSON ? this.collection.toJSON() : this.collection
                    }
                }
                else if (this.collection) {
                    return this.collection.toJSON ? this.collection.toJSON() : this.collection;
                }
                else if (this.model) {
                    return this.model.toJSON ? this.model.toJSON() : this.model
                }
            },

            // Populate view with data (fetch from collection / model)
            // @return jQuery.Deferred
            populate: function (opts, args) {
                var deferreds = [];
                if (this.model && this.model.fetch) {
                    deferreds.push(this.model.fetch(opts));
                }
                if (this.collection && this.collection.fetch) {
                    deferreds.push(this.collection.fetch(opts));
                }
                return $.when.apply($, deferreds);
            },

            // Reset view data
            // clear collection / model
            reset: function () {
                if (this.model) {
                    this.model.clear();
                }
                if (this.collection) {
                    this.collection.reset();
                }
                if (this.onReset) {
                    this.onReset();
                }
                return this;
            },

            /**
             * helper method for loading
             */
            startLoading: function () {
                this.$el.addClass('loading');
                return this;
            },

            /**
             * helper method for loading
             */
            stopLoading: function () {
                this.$el.removeClass('loading');
                return this;
            },
            
            /**
             * alerts / messages
             * 
             * @return DOMElement
             */
            message: function (msg, type) {
                if (typeof(type) !== 'string') {
                    type = 'success';
                }
                var content = '<button type="button" class="close" data-dismiss="alert">×</button>';
                return this.make("div", {"class": "alert alert-" + type}, content + msg);
            }
        });
        
        /**
         * List form
         *
         * Loops through a collection, creating a <li> for each item
         **/
        app.views.list = app.views.base.extend({
            
            tagName: 'ul',
            
            /**
             * Insert all subViews prior to rendering the View.
             * 
             * @https://github.com/tbranyen/backbone.layoutmanager#beforerender-function
             */
            beforeRender: function () {
                var self = this;
                if (this.collection) {
                    var iterator = function (item) {
                        var cls = self.itemView || app.views.base || Backbone.View;
                        if (item.constructor && (name = item.constructor.prototype.name) && (name in app.views)) {
                            cls = app.views[name];
                        }
                        this.insertView(new cls({
                            tagName: 'li',

                            model: item
                        }));
                    };
                    // Iterate over the passed collection and create a view for each item.
                    this.collection.each ? this.collection.each(iterator, this) : _.each(this.collection, iterator, this);
                }
            }
        });
		
		
        /**
         * View form
         * 
         * handles common form functionality, eg. validation
         */
        app.views.form = app.views.base.extend({
            
            tagName: 'form',
            
            events: {
                'submit': 'onSubmit',
                'click .btn.copy-element': 'copyElement'
            },
            
            initialize: function () {
                app.views.form.__super__.initialize.apply(this, arguments);
            },
            
                    
            afterRender: function () {
                this.delegateEvents();
            },

            // save form values to model
            commit: function () {
                if (this.model && this.validate()) {
                    if (this.beforeCommit) {
                        this.beforeCommit();
                    }
                    var data = this.getValues();
                    this.model.set(this.processData ? this.processData(data) : data).save(); // save model
                    if (this.afterCommit) {
                        this.afterCommit();
                    }
                }
            },
            
            /**
             * event handlers
             */
            
            // copy HTML element
            copyElement: function (event) {
                var $btn = $(event.target),
                    copy = $btn.data('copy'),
                    target = $btn.data('target'),
                    $target = $(target).last();
                
                if (target && $target) {
                    if (!copy) {
                        copy = 'after'; // if copy not set, default to "after""
                    }
                    
                    if ($target[copy]) {
                        var $new = $target.clone(true, true);
                        
                        // clear form element values, if any
                        $($new).find(':input').each(function() {
                            switch(this.type) {
                                case 'password':
                                case 'select-multiple':
                                case 'select-one':
                                case 'text':
                                case 'textarea':
                                    $(this).val('');
                                    break;
                                case 'checkbox':
                                case 'radio':
                                    this.checked = false;
                            }
                        });
                        
                        $target[copy]($new);
                    }
                }
                
                return false;
            },
            
            onSubmit: function () {
                return this.validate();
            },
            
            /**
             * validation
             */
            validate: function (event) {
                // check for required fields
                var success = true,
                    self = this;
                this.getElements().each(function() {
                    var $this = $(this);
                    if ($this.hasClass('required')) {
                        if (!self.getValue(this)) {
                            var $control = $this.closest('.control-group');
                            $control.addClass('error');
                            $(".form-error", $control).remove();
                            $this.after(self.make('span', {'class': 'form-error help-inline'}, "Field is required"));
                            success = false;
                        }
                    }
                });
                if (!success) {
                    this.$el.find('.error :input').first().focus();
                }
                return success;
            },
            
            getValue: function (el) {
                var $el = $(el);
                switch (el.type) {
                    case 'password':
                    case 'select-multiple':
                    case 'select-one':
                    case 'text':
                    case 'textarea':
                        return $el.val();
                        
                        break;
                    case 'checkbox':
                    case 'radio':
                        return el.checked;
                }
                return null;
            },
            
            
            getValues: function () {
                var o = {};
                var a = this.$el.serializeArray();
                $.each(a, function() {
                    if (o[this.name] !== undefined) {
                        if (!o[this.name].push) {
                            o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || '');
                    } else {
                        o[this.name] = this.value || '';
                    }
                });
                return o;
            },
            
            getElements: function () {
                return this.$el.find(":input");
            }
            
        });

        /*****************************
         * bootstrap the application *
         *****************************/
        app.bootstrap = function(Router) {
            var self = this;

            if (Router && !this.router) { 
                // bootstrap the application 
                $(document).ready(function() {
                    self.router = new Router();

                    // All navigation that is relative should be passed through the navigate
                    // method, to be processed by the router. If the link has a `data-bypass`
                    // attribute, bypass the delegation completely.
                    $(this).on("click", "a:not([data-bypass])", function(evt) {
                        // Get the absolute anchor href.
                        var href = {
                            prop: $(this).prop("href"), 
                            attr: $(this).attr("href")
                        };
                        // Get the absolute root.
                        var root = location.protocol + "//" + location.host + app.root;

                        // Ensure the root is part of the anchor href, meaning it's relative.
                        if (href.prop && href.prop.slice(0, root.length) === root) {
                            // Stop the default event to ensure the link will not cause a page
                            // refresh.
                            evt.preventDefault();

                            // `Backbone.history.navigate` is sufficient for all Routers and will
                            // trigger the correct events. The Router's internal `navigate` method
                            // calls this anyways.  The fragment is sliced from the root.
                            self.router.navigate(href.attr, {trigger: true});
                        }
                    });
                }); 
            }

            return this;
        };

        return app;
    }

    return new Application();
});