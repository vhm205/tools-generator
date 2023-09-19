"use strict";

var utils = require('../../utils/utils');
var sessionConf = require('../../config/cf_session');

class Session {

    constructor(session_key) {
        this.session_key = session_key;
    }

    saveSession(session, data) {
        session[sessionConf.getSessionKey(this.session_key)] = data;
    }

    getSession(session) {
        if (!utils.isEmptyObject(session[sessionConf.getSessionKey(this.session_key)])) {
            return session[sessionConf.getSessionKey(this.session_key)];
        } else {
            return null;
        }
    }

	detroySession(session) {
        if (!utils.isEmptyObject(session[sessionConf.getSessionKey(this.session_key)])) {
            session[sessionConf.getSessionKey(this.session_key)] = null;
        } else {
            return null;
        }
    }
}

module.exports = Session;