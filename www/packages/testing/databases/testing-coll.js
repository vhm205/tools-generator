"use strict";

const Schema = require('mongoose').Schema;
const BASE_COLL = require('../../../database/intalize/base-coll');

module.exports = BASE_COLL('testing', {

    /**
     * Bộ sưu tập
     */
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'image',
    }],
    /**
     * Hình ảnh
     */
    avatar: {
        type: Schema.Types.ObjectId,
        ref: 'image',
    },
    /**
     * Bộ sưu tập 2
     */
    images2: [{
        type: Schema.Types.ObjectId,
        ref: 'image',
    }],
    /**
     * Giá
     */
    price: {
        type: Number,
        required: true,
    },
});