"use strict";

const BASE_COLL = require('../../../database/intalize/base-coll');

module.exports  = BASE_COLL("function", {
    name: {
        type: String,
        trim: true,
        require: true
    },
    description: {
        type: String,
        default: '',
    },
    code: {
        type: String,
        unique: true,
        require: true
    },
    isModuleConfig: {
        type: Boolean,
        default: false
    },
    module: {
        type: String,
        require: true
    },
    model: {
        type: String,
        require: true
    },
    status: {
        type: String,
        default: 'IN_ACTIVE',
        enum: ['ACTIVE', 'IN_ACTIVE']
    }
});
