"use strict";

const BASE_COLL = require('../../../../database/intalize/base-coll');

module.exports = BASE_COLL('otp_authy', {
    phone: { 
        type: String,
        require: true
    },
    authyID: String,
    /**
     * 0: Inactive
     * 1: Active
     */
    isActive: {
        type: Number,
        default: 0
    } 
});
