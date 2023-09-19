"use strict";

const Schema	= require('mongoose').Schema;
const BASE_COLL = require('../../../../database/intalize/base-coll');

/**
 * COLLECTION ACCOUNT CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('account', {
	username: {
		type: String,
		trim: true,
	},
	fullname: {
		type: String,
		trim: true,
	},
	phone: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		trim: true,
	},
	password: {
		type: String,
		trim: true,
	},
	facebookUID: {
		type: String,
		trim: true
	},
	googleUID: {
		type: String,
		trim: true
	},
	appleUID: {
		type: String,
		trim: true
	},
	birthday: {
		day: Number,
		month: Number,
		year: Number,
	},
	avatar: {
		type:  Schema.Types.ObjectId,
		ref : 'image'
	},
	gender: {
		type: String,
		enum: ['male', 'female', 'other'],
		default: 'other'
	},
	/**
	 * Loại tài khoản.
	 * [normal]. Tài khoản thường
	 * [facebook]. Facebook
	 * [google]. Google
	 * [apple]. Apple
	 */
	type: {
		type: [String],
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
	/**
	 * Ngôn ngữ
	 */
	language: {
		type: String,
		default: "vi"
	},
	/**
	 * Device user login
	 */
	devices: [{
		deviceName: String,
		deviceType: String,
		deviceID: String,
		fcmToken: String,
	}],
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
