"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('../../../database/intalize/base-coll');

module.exports  = BASE_COLL("template_noti", {
    title: {
        type: String,
        trim: true,
        require: true
    },
    description: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        require: true,
        enum: ['MAIL', 'SMS', 'FCM', 'SOCKET', 'ZALO_ZNS']
    },
    func: {
        type: Schema.Types.ObjectId,
        ref: 'function',
    },
    content: {
        type: String,
        default: ''
    },
    params: {
        type: String,
    },
    meta: {
        type: Schema.Types.Mixed,
    }
});
