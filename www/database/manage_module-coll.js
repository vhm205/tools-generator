"use strict";

const Schema    = require('mongoose').Schema;
const BASE_COLL = require('./intalize/base-coll');

module.exports  = BASE_COLL("manage_module", {
    name: {
        type: String,
        trim: true
    },
    models: [{
        type: Schema.Types.ObjectId,
        ref: 'manage_coll'
    }]
});
