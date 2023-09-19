"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('../../../database/intalize/base-coll');

module.exports  = BASE_COLL("event_noti", {
    templateNoti: {
        type: Schema.Types.ObjectId,
        ref: 'template_noti',
    },
    func: {
        type: Schema.Types.ObjectId,
        ref: 'function',
    },
    queueName: {
        type: String,
    },
    queueURL: {
        type: String,
    },
    status: {
        type: String,
        default: 'IN_ACTIVE',
        enum: ['ACTIVE', 'IN_ACTIVE']
    }
});
