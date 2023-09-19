"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');

/**
 * COLLECTION API-IDENTIFIER CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('api_identifier', {
	/**
	 * API name
	 */
	name: {
		type: String,
		trim: true,
		required: true
	},
	/**
	 * Identifier API
	 */
	endpoint: {
		type: String,
		required: true
	},
	/**
	 * 1: Kích hoạt
	 * 2: Không kích hoạt
	 */
	status: {
		type: Number,
		default: 1
	},
});
