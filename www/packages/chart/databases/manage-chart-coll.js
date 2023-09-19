"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');
const Schema	= require('mongoose').Schema;

/**
 * COLLECTION BEHAVIOR USER CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('manage_chart', {
	name: String,
    description: String,
    folderName: String,
});
