"use strict";

const BASE_COLL = require('./intalize/base-coll');
const Schema    = require('mongoose').Schema;

module.exports  = BASE_COLL("job_bull_queue", {
    queue_key: {
        type: String,
        required: true
    },
    jobID: {
        type: String,
        unique: true,
        required: true
    },
    function: {
        type: String,
        default: ''
    },
    /**
     * 0: Chưa hoàn thành
     * 1: Đã hoàn thành
     * 2: Thất bại
     */
    status: {
        type: Number,
        default: 0
    },
    // Số lần thất bại
    totalFail: {
        type: Number,
        default: 0
    },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
});
