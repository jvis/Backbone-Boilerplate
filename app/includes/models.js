// filename: models.js
define([
    'jquery', 
    'app',
    'backbone',
], function ($, app, Backbone) {
    
    var models = {};
    
    /**
     * Example model
     */
    models.example = { // model name
        
        /**
         * define model properties
         * 
         * @see http://backbonejs.org/#Model
         */        
        idAttribute: 'example_id', // http://backbonejs.org/#Model-idAttribute
        
        // @see http://backbonejs.org/#Model-defaults
        defaults: {
            "appetizer":  "caesar salad",
            "entree":     "ravioli",
            "dessert":    "cheesecake"
        },
  
        fetch: false, // set fetch = false to disable fetching
        
        /**
         * define collections using this model
         */
        collections: {
            
            examples: { // collection name
                
                /**
                 * define collection properties
                 * 
                 * @see http://backbonejs.org/#Collection
                 */
                
                
                /**
                 * define views using this collection
                 */
                views: {
                    
                    examples: {
                        /**
                         * define view properties
                         */
                    },
                    
                    examplesTable: {
                        /**
                         * define view properties
                         */
                    }
                }
            }
        },
        
        /**
         * define views using this model
         */
        views: {
            
            example: {

                /**
                 * define view properties
                 * 
                 * @see http://backbonejs.org/#View
                 * @see https://github.com/tbranyen/backbone.layoutmanager
                 */
                template: 'example',
                
                tagName: "article",

                className: "example",

                events: {
                    "click .icon": "open"
                },
                
                serialize: function () {
                    return {
                        code: JSON.stringify(this.model ? this.model.toJSON() : {}, null, '\t')
                    }
                },
                
                open: function () {
                    alert('open');
                }
            }
        }
    };
  
    return models;
});
