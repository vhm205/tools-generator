"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');
const Schema	= require('mongoose').Schema;

/**
 * COLLECTION ROLE-PERMISSION CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('role_permission', {
	/**
	 * API Identifier
	 */
	scope: {
		type:  Schema.Types.ObjectId,
		ref : 'api_scope'
	},
	/**
	 * ID role
	 */
	role: {
		type:  Schema.Types.ObjectId,
		ref : 'role_base'
	},
});
