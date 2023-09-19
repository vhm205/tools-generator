"use strict";

var lang = require('../../language/language');

module.exports = function (app) {
    app.locals.lang = function (language, key) {
        if (lang.getLanguage(key, language) === null || lang.getLanguage(key, language) === undefined) {
            if (lang.getLanguage(key, 'vn') !== null && lang.getLanguage(key, 'vn') !== undefined) {
                return lang.getLanguage(key, 'vn');
            } else if (lang.getLanguage(key, 'en') !== null && lang.getLanguage(key, 'en') !== undefined) {
                return lang.getLanguage(key, 'en');
            } else if (lang.getLanguage(key, 'ja') !== null && lang.getLanguage(key, 'ja') !== undefined) {
                return lang.getLanguage(key, 'ja');
            } else {
                return key;
            }
        } else return lang.getLanguage(key, language);
    };
};