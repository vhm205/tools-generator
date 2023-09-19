"use strict";

/**
 * diều hướng gọi các hàm xử lý cho view.
 */


var timeHelper = require('./module/time_helpers');
var stringHelper = require('./module/string_helpers');
var languageGet = require('./module/language_get');

module.exports = function (app) {
    timeHelper(app);
    stringHelper(app);
    languageGet(app)
};