"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('../../../database/intalize/base-coll');

/**
 * COLLECTION IMAGE CỦA HỆ THỐNG
 */
module.exports = BASE_COLL('image', {
    name: {
        type: String,
    },
    path: {
        type: String,
    },
    type: {
        type: String,
    },
    size: {
        type: String,
    },
    nameBeforeCompress: {
        type: String,
    },
    pathBeforeCompress: {
        type: String,
    },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
});
