"use strict";

module.exports = {
    development: {
        _mongod_name: process.env.MONGO_DB      || 'ldk_tools_op',
        _mongod_user: process.env.MONGO_USER    || '',
        _mongodb_pass: process.env.MONGO_PWD    || '',
        _mongodb_host: process.env.MONGO_HOST   || 'localhost',
        _mongodb_port: process.env.MONGO_PORT   || '27017'
    },

    product: {
        _mongod_name: process.env.MONGO_DB      || 'ldk_tools_op',
        _mongod_user: process.env.MONGO_USER    || '',
        _mongodb_pass: process.env.MONGO_PWD    || '',
        _mongodb_host: process.env.MONGO_HOST   || 'localhost',
        _mongodb_port: process.env.MONGO_PORT   || '27017'
    }
};
