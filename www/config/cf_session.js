"use strict";

const _session_version = process.env.SESSION_VERSION;
const _session_key = process.env.SESSION_KEY;
const session = require('express-session');
require('../../app');

const redis = require("redis");
const redisStore = require('connect-redis')(session);
const client = redis.createClient();

exports.sessionConf = function (app) {
    let storeRedis = new redisStore({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        client: client,
        ttl: 10 * 24 * 60 * 60
    });

    let ses = session({
        secret: _session_key,
        store: storeRedis,
        saveUninitialized: false,
        resave: false
    });

    app.use(ses);

    return ses;
};

/**
 * @return {string}
 */
exports.getSessionKey = function GetSessionKey(mainKey) {
    return mainKey + '_' + _session_key + '_' + _session_version;
};