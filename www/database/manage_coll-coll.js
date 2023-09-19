"use strict";

const BASE_COLL = require('./intalize/base-coll');

module.exports  = BASE_COLL("manage_coll", {
    name: String,
    description: String,
    folderName: String,
    icon: String,
    isApiAddress: Boolean,
    isSystemConfig: Boolean,
});
