"use strict";
const BASE_COLL = require('../../../database/intalize/base-coll');
const Schema        = require('mongoose').Schema;

/**
 * COLLECTION BEHAVIOR USER CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('behavior_user', {
	// USER
	user: {
		type:  Schema.Types.ObjectId,
		ref : 'user'
	},
	/**
	 * Hành động
	 */
	action: {
		type:  String
	},
	/**
	 * API
	 */
	url: {
		type:  String
	},
	/**
	 * Mô tả
	 */
	description: {
		body: {
			type: Object
		},
	},
	/**
	 * Địa chỉ IP
	 */
	 IPAddress: {
		type: Object
	},
	/**
	 * TRUY CẬP BẰNG
	 * 1. BROWSER_ACCESS
	 * 2. MOBILE_ACCESS
	 */
	envAccess: {
		type: Number,
		default: 1
	},
});
