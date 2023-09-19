"use strict";

var lang = require('../../language/language');


module.exports = function (app) {
    app.locals.priceFormat = function (price) {
        return price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    };

    app.locals.getDayOfWeek = function (number, langKey) {
        let day = "";
        switch(number){
            case 0:
                day = "chu_nhat";
                break;
            case 1:
                day = "thu_hai";
                break;
            case 2:
                day = "thu_ba";
                break;
            case 3:
                day = "thu_tu";
                break;
            case 4:
                day = "thu_nam";
                break;
            case 5:
                day = "thu_sau";
                break;
            case 6:
                day = "thu_bay";
                break;
        }

        if(lang.getLanguage(day, langKey)===null|| lang.getLanguage(day, langKey)===undefined){
            return day;
        }else return lang.getLanguage(day, langKey);
    };
};