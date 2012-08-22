window.module = {
    exports: {} // hack to allow AMD processing of ICH
};
(function (define) {
    "use strict";
    define(['../js/libs/icanhaz.min'], function () {
        window.ich = window.module.exports;
        window.module = undefined;
        return window.ich;
    });
}(window.define));
