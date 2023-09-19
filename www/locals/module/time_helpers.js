"use strict";

/**
 * xử lý các hàm về thời gian cho view sử dụng.
 */
var timeUtils = require('../../utils/time_utils');

module.exports = function (app) {
    /**
     * chuyển định dạng thời gian sang "H:m || MM-DD-Y"
     * @param oldTimeFormat
     */
    app.locals.convertFormatTime1 = function (oldTimeFormat) {
        return timeUtils.parseTimeFormat2(oldTimeFormat);
    };

    app.locals.convertFormatTimeOption = function (oldTimeFormat, option) {
        return timeUtils.parseTimeFormatOption(oldTimeFormat, option);
    }
};