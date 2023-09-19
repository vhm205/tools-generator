"use strict";

/**
 * điều hướng host và port của server
 * @type {boolean}
 */
exports.host_product = process.env.NODE_ENV == 'development' ? false : true;

/**
 * đều hướng kết nối database
 * @type {boolean}
 */
exports.database_product = process.env.NODE_ENV == 'development' ? false : true;