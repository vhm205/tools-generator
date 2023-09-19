"use strict";

const Schema        = require('mongoose').Schema;
const BASE_COLL     = require('../../../database/intalize/base-coll');

module.exports  = BASE_COLL("history_log_noti", {
    triggerEventNotiID: {
        type: Schema.Types.ObjectId,
        ref: 'event_noti',
    },
    type: {
        type: String,
        require: true,
        enum: ['MAIL', 'SMS', 'FCM', 'SOCKET']
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
    /**
     * SENT: đã gửi
     * UNSENT: chưa gửi được
     */
    status: {
        type: String,
        default: 'UNSENT',
        enum: ['SENT', 'UNSENT']
    }
});
