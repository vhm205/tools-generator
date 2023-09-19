"use strict";

const Settings = {
    langDefault: 'vn',
    langList: {
        'en': require('./module/lang_en'),
        'vn': require('./module/lang_vn'),
        'ja': require('./module/lang_ja'),
    }
};

module.exports = {
    langDefault: Settings.langDefault,

    getLanguage: function (key, language) {
        if (Settings.langList[language] !== null) {
            return Settings.langList[language][key];
        } if (Settings.langList['vn'] !== null) {
            return Settings.langList['vn'][key];
        }if (Settings.langList['en'] !== null) {
            return Settings.langList['en'][key];
        }if (Settings.langList['ja'] !== null) {
            return Settings.langList['ja'][key];
        }else {
            return key;
        }
    },

    checkKeyLang: function (key) {
        return Settings.langList[key] !== null;
    }
};