"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');
const Schema	= require('mongoose').Schema;

/**
 * COLLECTION API-SCOPE CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('api_scope', {
	/**
	 * Scope name
	 */
	name: {
		type: String,
		trim: true,
		required: true
	},
	/**
	 * Description scope
	 */
	description: {
		type: String,
		trim: true,
		required: true
	},
	/**
	 * API Identifier
	 */
	api: {
		type:  Schema.Types.ObjectId,
		ref : 'api_identifier'
	},
});
