"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');

/**
 * COLLECTION ROLE-BASE CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('role_base', {
	/**
	 * Role name
	 */
	name: {
		type: String,
		trim: true,
	},
	/**
	 * Description role
	 */
	description: {
		type: String,
		default: ''
	},
});
