"use strict";

const Schema	= require('mongoose').Schema;
const BASE_COLL = require('../../../../database/intalize/base-coll');

/**
 * COLLECTION USER - TOKEN CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('account_token', {
	account: {
		type: Schema.Types.ObjectId,
		ref: 'account'
	},
	token: String,
});
