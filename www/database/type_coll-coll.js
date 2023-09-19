"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('./intalize/base-coll');

module.exports  = BASE_COLL("type_coll", {
    coll: {
        type: Schema.Types.ObjectId,
        ref: 'manage_coll'
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'number', 'enum', 'date', 'boolean', 'object', 'array'],
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    },
    widthDatatable: {
        type: String,
        default: ''
    },
    isCompare: {
        type: Boolean,
        default: false
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    isUnique: {
        type: Boolean,
        default: false
    },
    isRequire: {
        type: Boolean,
        default: false
    },
    isTrim: {
        type: Boolean,
        default: false
    },
    isStatus: {
        type: Boolean,
        default: false
    },
    isOrder: {
        type: Boolean,
        default: false
    },
    isPassword: {
        type: Boolean,
        default: false
    },
    isExport: {
        type: Boolean,
        default: false
    },
    isImport: {
        type: Boolean,
        default: false
    },
    isLink: {
        type: Boolean,
        default: false
    },
    isCurrency: {
        type: Boolean,
        default: false
    },
    isInsert: {
        type: Boolean,
        default: false
    },
    isUpdate: {
        type: Boolean,
        default: false
    },
    isSlug: {
        type: Boolean,
        default: false
    },
    isEnum: {
        type: Boolean,
        default: false
    },
    dataEnum: [{
        title: String,
        value: String,
        color: String
    }],
    isSeparateCondition: {
        type: Boolean,
        default: false
    },
    messageError: {
        type: String,
        default: ''
    },
    dataCompareField: [{
        fromField: String,
        compare: String,
        toField: String,
        condition: String,
        messageError: String,
        // Expression
        isExprCondition: Boolean,
        calculationExpr: String,
        calculationValue: Number,
        calculationUnit: String,
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    defaultValue: {
        type: String,
        default: ''
    },
    formatDate: {
        type: String,
    },
    isShowList: {
        type: Boolean,
        default: false
    },
    isTinyMCE: {
        type: Boolean,
        default: false
    },
    isTextarea: {
        type: Boolean,
        default: false
    },
    isItalic: {
        type: Boolean,
        default: false
    },
    isBold: {
        type: Boolean,
        default: false
    },
    isImage: {
        type: Boolean,
        default: false
    },
    isBigData: {
        type: Boolean,
        default: false
    },
    isInsertUpdateFrom: {
        type: Boolean,
        default: false
    },
    isApiAddress: {
        type: Boolean,
        default: false
    },
    dataInsertUpdateFrom: [String],
    fileType: { 
        type: String,
        default: ''
    },
    dateType: { 
        type: String,
        default: ''
    },
    typeImage: { 
        type: Number
    },
    typeUpload: { 
        type: Number
    },
    ref: {
        type: String,
    },
    refShow: {
        type: String,
    },
    followBy: {
        type: String
    },
    tableSub: {
        type: String
    }
});
