"use strict";

const userSession = new (require('./intalize/session'))('user-session');

module.exports = {
    saveUser(session, { user, token}) {
        userSession.saveSession(session, {
            user, token
        });
    },
    isLogin(session) {
        return userSession.getSession(session) !== null;
    },

    getUser(session) {
        return userSession.getSession(session);
    },

    getUserId(session) {
        if (userSession.getSession(session) === null)
            return 0;
        else return userSession.getSession(session)._id;
    },

    getUserRole(session) {
        if (userSession.getSession(session) === null)
            return 0;
        else return userSession.getSession(session).role;
    },

    isAdmin(session) {
        if (userSession.getSession(session) !== null) {
            return userSession.getSession(session).role === 1;
        } else {
            return false;
        }
    },

    isUser(session) {
        if (userSession.getSession(session) !== null) {
            return userSession.getSession(session).role === 2;
        } else {
            return false;
        }
    },

    isTeacher(session) {
        if (userSession.getSession(session) !== null) {
            return userSession.getSession(session).role === 3;
        } else {
            return false;
        }
    },

    updateLang(session, lang) {
        let user = userSession.getSession(session);
        if (user !== null) {
            user.lang = lang;
        }
    },

	destroySession (session) {
        return userSession.detroySession(session);
    },
};