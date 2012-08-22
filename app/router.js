define([
    'jquery', 
    'backbone', 
    'app'
], function($, Backbone, app) {
    // Defining the application router, you can attach sub routers here.
    var Router = Backbone.Router.extend({

        initialize: function () {
            var self = this;

            this.layoutName = app.layoutSettings ? app.layoutSettings.name : "page";
            this.contentId = app.layoutSettings ? app.layoutSettings.content : "page-content";

            // Keep track of the history of pages (we only store the page URL). Used to identify the direction
            // (left or right) of the sliding transition between pages.
            this.pageHistory = [],

            this.currentPage = null,
            
            // cache jQuery selectors
            this.$els = {},
            
            // cache views (keyed by view name)
            this.views = {},
            
            this.currentView = null,
            
            layoutOpts = { 
                views: {},
                template: app.layoutSettings.template || this.layoutName
            }

            // create menu view, if necessary
            if (app.selectors.menu) {
                var cls = app.views.menu || app.views.base || Backbone.View;
                layoutOpts.views[app.selectors.menu] = this.menu = new cls({
                    keep: true // keep view
                });
            }

            // initialize layout
            app.useLayout(this.layoutName, layoutOpts, false);

            // render layout and trigger callback
            app.layout.render(function (el) {
                self.$els.page = self.$els.page || $(el);
                
                // cache sections
                self.$els.sections = self.$els.sections || $(app.selectors.sections, el);

                // create routes from sections
                self.$els.sections.each(function () {
                    var $this = $(this);
                    if (route = $this.data('route')) {
                        // add route
                        self.route(route, $this.attr("id"), function (arg) {
                            // render section
                            self.renderSection($this, arg);
                        });
                    }
                });

                // Register event listener for back button troughout the app
                self.$els.page.on('click', '.header-back-button', function(event) {
                    window.history.back();
                    return false;
                });

                // Check of browser supports touch events...
                if (document.documentElement.hasOwnProperty('ontouchstart')) {
                    // ... if yes: register touch event listener to change the "selected" state of the item
                    self.$els.page.on('touchstart', 'a', function(event) {
                        self.selectItem(event);
                    });
                    self.$els.page.on('touchend', 'a', function(event) {
                        self.deselectItem(event);
                    });
                } 
                else {
                    // ... if not: register mouse events instead
                    self.$els.page.on('mousedown', 'a', function(event) {
                        self.selectItem(event);
                    });
                    self.$els.page.on('mouseup', 'a', function(event) {
                        self.deselectItem(event);
                    });
                }
            }).done(function () {
                // Trigger the initial route and enable HTML5 History API support
                Backbone.history.start({
                    pushState: false, 
                    root: app.root
                });
            })

            return this;
        },


        selectItem: function(event) {
            $(event.target).addClass('tappable-active');
        },

        deselectItem: function(event) {
            $(event.target).removeClass('tappable-active');
        },

        /**
         * Route callback: render section
         */
        renderSection: function ($section, arg) {
            var view = $section.data('view'),
            self = this,
            cls = app.views.base || Backbone.View;
            
            if (view) {
                cls = app.views[view] || cls;
                view = new cls();

                // fetch data and render
                if (arg && view.model) {
                    view.model.id = arg; // if ID set in URL, set to model
                }

                app.layout.$el.addClass('loading');

                // populate view and render (uses deferred object)
                $.when(view.populate(), this.showView(view, $section)).done(function () {
                    app.layout.$el.removeClass('loading');
                    self.slidePage(view, $section);
                });
            }
            else {
                view = new cls();
                
                app.layout.$el.addClass('loading');

                // render view (uses deferred object)
                $.when(this.showView(view, $section)).done(function () {
                    app.layout.$el.removeClass('loading');
                    self.slidePage(view, $section);
                });
            }
        },
        
        /**
         * Show view
         * 
         * Closes existing view (unbinds events, etc) first - avoids memory leaks
         */
        showView: function (view, $section) {
            if (this.currentView) {

                if ($section.is(app.selectors.defaultSection)) {
                    // Always apply a Back (slide from left) transition when we go back to the default page
                    view.slideFrom = "left";
                    view.$el.addClass('page stage-left');
                    // Reinitialize page history
                    this.pageHistory = [window.location.hash];
                } 
                else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
                    // The new page is the same as the previous page -> Back transition
                    view.slideFrom = "left";
                    view.$el.addClass('page stage-left');
                    this.pageHistory.pop();
                } 
                else {
                    // Forward transition (slide from right)
                    view.slideFrom = "right";
                    view.$el.addClass('page stage-right');
                    this.pageHistory.push(window.location.hash);
                }
                
            }
            else {
                // If there is no current page (app just started) -> No transition: Position new page in the view port
                view.$el.addClass('page stage-center');
                this.pageHistory = [window.location.hash];
            }

            // add view to layout
            app.layout.setView('#' + this.contentId, view); 
            return view.render();
        },

        slidePage: function (view, $section) {
            var self = this;
            
            // Slide in the new page
            this.currentPage = view.$el.addClass('page transition')

            if (this.menu && this.menu.setActivePage) {
                this.menu.setActivePage($section, view);
            }
                        
            // cleaning up: remove old views
            if (this.currentView && this.currentView.close) {
                this.currentView.close();
            } 
            
            this.currentPage.addClass("stage-center");
            this.currentView = view;
        },

        getTitle: function () {
            return this.currentPage ? this.currentPage.data('title') || app.name : app.name;
        }
    })

    return Router;

});