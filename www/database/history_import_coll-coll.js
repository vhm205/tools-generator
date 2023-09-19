"use strict";
const Schema        = require('mongoose').Schema;
const BASE_COLL = require('./intalize/base-coll');

module.exports  = BASE_COLL("history_import_coll", {
    coll: {
        type: Schema.Types.ObjectId,
        ref: 'manage_coll'
    },

    // ID của Field
    fieldID: {
        type: String
    },

    // Tên biến
    name: {
        type: String
    },

    // Mô tả tên biến
    note: {
        type: String
    },

    // Loại
    type: {
        type: String
    },

    // Biến chọn insert DYNAMIC
    variableChoice : {
        type: String
    },

    // TÊN BIẾN CỦA COLL IMPORT
    nameFieldRef: {
        type: String
    },

    // TÊN BIẾN
    variable: {
        type: String
    },

    // BẮT BUỘC NHẬP
    isRequire: {
        type: Boolean
    },

    ref: {
        type: String
    },

    // DAta động
    dataDynamic: [
        {
            type: String
        }
    ],

    // Ánh xạ
    mappingRef: [
        {
            type: String
        }
    ],

    // ARRAY AGGREGATE
    listItemImport: [
        {
            type: Object
        }
    ],

    // ĐIỀU KIỆN XÓA
    condition : {
        type: Object
    },

});
