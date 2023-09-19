"use strict";

const Schema	= require('mongoose').Schema;
const BASE_COLL = require('../../../database/intalize/base-coll');

/**
 * COLLECTION USER - ADMIN CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('user', {
	username: {
		type: String,
		trim: true,
		unique: true,
		require: true
	},
	fullname: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		trim: true,
		unique: true,
		require: true
	},
	password: {
		type: String,
		require: true
	},
	/**
	 * Trạng thái hoạt động.
	 * 1. Hoạt động
	 * 2. Khóa
	 */
	status: {
		type: Number,
		default: 1
	},
	language: {
		type: String,
		default: "vi"
	},
	/**
	 * RBAC
	 */
	roles: [{
		type:  Schema.Types.ObjectId,
		ref : 'role_base'
	}],
	/**
	 * Directly permission
	 */
	permissions: [{
		type:  Schema.Types.ObjectId,
		ref : 'api_scope'
	}],
});
