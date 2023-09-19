"use strict";

const hostProduct = require('./cf_mode').host_product;

/**
 * [HOST-PORT PRODUCT]
 */
exports.host_product = process.env.HOST_PRODUCT;
exports.port_product = process.env.PORT_PRODUCT;

/**
 * [HOST-PORT DEVELOPMENT]
 */
exports.host_dev = process.env.HOST;
exports.port_dev = process.env.PORT;

/**
 * [HOST ROUTER]
 */
exports.host = (!hostProduct) ? this.host_dev : this.host_product;
exports.port = (!hostProduct) ? this.port_dev : this.port_product;
exports.domain = (!hostProduct) ? `http://${this.host}:${this.port}/` : process.env.STAGING_DOMAIN;
