"use strict";

//Adding Title Case to String for only single word
String.prototype.toTitleCase = function () {
    return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
}

String.prototype.toCapitalize = function () {
    // .replace(/(^|\s)\S/g, l => l.toUpperCase())
    return this.replace(/\b\w/g, l => l.toUpperCase());
}
