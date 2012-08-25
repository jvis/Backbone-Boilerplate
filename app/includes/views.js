// Filename: views.js
define([
    'jquery', 
    'app',
    'backbone',
], function ($, app, Backbone) {
    
    var views = {};
    
    /**
     * Home view
     */
    views.home = {
        
        /**
         * define view properties
         * 
         * @see http://backbonejs.org/#View
         * @see https://github.com/tbranyen/backbone.layoutmanager
         */
        events: {},
        
        /**
         * Template
         * 
         * @param string|object
         */
        template: 'home', // template name
        
        // Example template declaration with CSS:
        // 
        // template: {
        //    template: 'home',
        //    css: [
        //        'css1',
        //        'css2'
        //    ]
        // }
        
        /**
         * serialize, return data to template
         * 
         * @see https://github.com/tbranyen/backbone.layoutmanager#working-with-template-data
         */
        serialize: function () {
            return {
                code: JSON.stringify(app.init, null, '\t')
            }
        },
        
        /**
         * optional: define child views
         */
        views: {

            homeForm: {
                // optional: specify different base class to extend
                // by default this class would extend "app.views.home"
                base: app.views.form
            }
        }
    };
	
    /**
     * Menu view
     */
    views.menu = {
        
        /**
         * Template
         * 
         * @param string|object
         */
        template: 'menu', // template name

        setActivePage: function (page, view) {
            this.activePage = page;	
            this.setTitle(page.attr('title') || page.data('title') || app.name);
            this.setActions(view ? view.actions || [] : []);
        },
        
        setTitle: function (title) {
            $(".brand", this.el).text(title);
        },
        
        getActions: function () {
            if (!this.$actions) {
                this.$actions = $("#menu-actions", this.el);
            }
            return this.$actions;
        },
        
        setActions: function (actions) {
            var self = this,
                $actions = this.getActions(),
                $menu = $("ul.dropdown-menu", $actions);

            $actions.hide();
            $menu.empty();

            var added = false;

            $.each(actions, function (index, value) {
                var $link = $(self.make("a", {
                    "class": "action", 
                    "title": value.title || "",
                    "href": value.href
                }, value.text));
                if (value.events) {
                    $.each(value.events, function (event, callback) {
                        $link.on(event, callback);
                    });
                }
                $menu.append(self.make('li', {}, $link));
                added = true;
            });

            if (added) {
                $actions.show();
            }
        }
    };
    
    return views;
});
