"use strict";

exports.isBoolean = val => {
    return val !== undefined && typeof val == "boolean";
}

exports.isTrue = val => {
    return val && val !== '' && val !== undefined && val === 'true';
}

exports.isEmptyObj = obj => Object.keys(obj).length === 0 && obj.constructor === Object;

exports.isEmpty = function (value) {
    return typeof value == 'string'
        && !value.trim()
        || typeof value == 'undefined'
        || value === null
        || value == undefined;
};