"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('./intalize/base-coll');

module.exports  = BASE_COLL("custom_api", {
    coll: {
        type: Schema.Types.ObjectId,
        ref: 'manage_coll'
    },
    method: {
        type: String,
        required: true,
        enum: ['GET', 'POST', 'PUT', 'DELETE']
    },
    endpoint: {
        type: String,
    },
    authenticate: {
        type: String,
        default: ''
    },
    authorize: {
        type: String,
        default: ''
    },
    note: {
        type: String,
        default: ''
    },
    typePost: {
        type: String,
    },
    typeGet: {
        type: String
    },
    typeDelete: {
        type: String
    },
    fields: {
        type: Array
    },
    fieldsPopulate: {
        type: Array
    }
});
