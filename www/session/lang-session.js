"use strict";

const langSession = new (require('./intalize/session'))('lang-session');
const language = require('../language/language');

module.exports = {
    saveLang(session, lang){
        langSession.saveSession(session, lang);
    },

    getLang(session){
        return langSession.getSession(session) === null ? language.langDefault : langSession.getSession(session);
    }
};