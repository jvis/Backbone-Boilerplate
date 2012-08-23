Backbone-Boilerplate
===========================  
  
  
Simple Backbone.JS boilerplate application, designed for rapid HTML5 application development.  
  
In contrast to some Backbone boilerplates available, the focus of this architecture is reusability and simplicity. 
The entire application is configured using a configuration object. All routes and pages are specified using HTML5 markup.
  
### Demo: http://jvis.github.com/Backbone-Boilerplate  

  
Includes useful features, such as:  
* Hierarchical object model for all class types (models, collections, views)
* Asynchronous template loading (including CSS)
* Asynchronous Module Definition (AMD)
* localStorage support
* Page transitions  
* Google Analytics tracking  
* ... and more ...
  
  
### Dependencies:  
Backbone.JS - http://documentcloud.github.com/backbone/  
Lodash - https://github.com/bestiejs/lodash (or Underscore)    
JQuery - http://jquery.com  
ICanHaz.js - http://icanhazjs.com (or Handlebars)    
Require.JS - http://requirejs.org  
  
Twitter Bootstrap (http://twitter.github.com/bootstrap/) has been used for the UI.  
  
  
#### Note:
* LoDash is a drop-in replacement for Underscore.JS (http://underscorejs.org/). Will work with either.  
* Also supports Handlebars templates (http://handlebarsjs.com/).
 

### Application structure:
* /app
  * app.js           = application class
  * appConfig.js     = applicaton configuration
  * config.js        = require.js configuration
  * main.js          = application entry point and bootstrap
  * router.js        = Backbone.Router object
  * /includes
      * collections.js    = collections
      * models.js         = models
      * views.js          = views
* /css
  * ... stylesheets ...
* /ico
  * ... favicon / etc ...
* /img
  * ... images ...
* /js
  * /libs
      * ... libraries (eg. JQuery, Backbone, etc) ...
  * /plugins
      * ... plugins (eg. Backbone.LayoutManager) ... 
* /templates
  * page.html       = main layout template (includes section / route configuration)
  * ... template files ...
* index.html        = index file
   
   
This is a work-in-progress. Let me know if you have any suggestions or issues.