"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');
const Schema	= require('mongoose').Schema;

/**
 * COLLECTION BEHAVIOR USER CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('chart', {

	manage_chart: {
        type: Schema.Types.ObjectId,
        ref: 'manage_chart'
    },

	// coll: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'manage_coll'
    // },
	
	name: {
		type:  String
	},

	description: {
		type:  String
	},

	col: {
		type:  String
	},

	format_chart: {
		type:  String
	},
	
	type_chart: {
		type:  String
	},

	data_source:  {
		type:  String,
		enum: ['SIMPLE', 'QUERY', 'API'],
	},

	data_source_obj:  {
		type:  Object,
	},
	// /**
	//  * FIELD hiển thị
	//  */
	// label: [{
	// 	type:  String
	// }],

	// /**
	//  * Quan hệ
	//  */
	// relationship: {
	// 	type:  String
	// },


	// view: {
	// 	type:  String
	// },

	// value: {
	// 	type:  String
	// },

	// limit:  {
	// 	type:  Number
	// },

});
