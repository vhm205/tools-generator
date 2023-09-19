"use strict";
const Schema        = require('mongoose').Schema;
const BASE_COLL = require('./intalize/base-coll');

module.exports  = BASE_COLL("history_export_coll", {
    coll: {
        type: Schema.Types.ObjectId,
        ref: 'manage_coll'
    },
    list_type_coll: [
        {
            type: String
        }
    ],

    // ARRAY ITEM HISORY EXPORRT CHOICE
    listItemExport: [
        {
            type: Object
        }
    ],

    // CHỌN CSV || EXCEL
    chooseCSV: Number,

    // TÊN COLL CHA
    nameOfParentColl: String
});
