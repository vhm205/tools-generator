"use strict";

/**
 * EXTERNAL PACKAGE
 */
const path = require('path');

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                   = require('../../../routing/child_routing');
const { CF_ROUTINGS_TRIGGER_EVENT } = require('../constants/trigger_event.uri');

/**
 * MODEL
 */
const { MODEL: SMS_MODEL }          = require('../models/sms');
const { MODEL: FCM_MODEL }          = require('../models/fcm');
const { MODEL: EMAIL_MODEL }        = require('../models/email');
const { MODEL: SOCKET_MODEL }       = require('../models/socket');
const TRIGGER_EVENT_MODEL           = require('../models/trigger_event').MODEL;

/**
 * COLLECTIONS
 */
const MANAGE_MODULE_COLL = require('../../../database/manage_module-coll');
const FUNCTION_COLL = require('../databases/function-coll');
const TEMPLATE_NOTI_COLL = require('../databases/template.noti-coll');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ****************************** ================================
             * ========================== QUẢN LÝ TRIGGER - NOTIFICATION ================================
             * ========================== ****************************** ================================
             */

            [CF_ROUTINGS_TRIGGER_EVENT.TRIGGER_EVENT]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Trigger Event Notification - LDK SOFTWARE',
                    code: 'TRIGGER_EVENT',
                    inc: path.resolve(__dirname, '../views/index.ejs')
                },
                methods: {
                    get: [async function (req, res) {
                        const listFunctions = await FUNCTION_COLL
                            .find({})
                            .sort({ _id: -1 })
                            .lean();

                        const listModules = await MANAGE_MODULE_COLL
                            .find({})
                            .populate('models')
                            .sort({ _id: -1 })
                            .lean();

                        ChildRouter.renderToView(req, res, {
                            listFunctions,
                            listModules
                        });
                    }]
                }
            },

            [CF_ROUTINGS_TRIGGER_EVENT.INSERT_FUNCTIONS]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    post: [async function (req, res) {
                        const { functions } = req.body;

                        const response = await TRIGGER_EVENT_MODEL.insertFunctions({
                            functions
                        });
                        res.json(response);
                    }]
                }
            },

            [CF_ROUTINGS_TRIGGER_EVENT.INSERT_TEMPLATES]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    post: [async function (req, res) {
                        const { templates } = req.body;

                        const response = await TRIGGER_EVENT_MODEL.insertTemplates({
                            templates
                        });
                        res.json(response);
                    }]
                }
            },

            [CF_ROUTINGS_TRIGGER_EVENT.INSERT_EVENTS]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    post: [async function (req, res) {
                        const { events } = req.body;

                        const response = await TRIGGER_EVENT_MODEL.insertEvents({
                            events
                        });
                        res.json(response);
                    }]
                }
            },

            [CF_ROUTINGS_TRIGGER_EVENT.GET_INFO_TEMPLATE]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    get: [async function (req, res) {
                        const { templateID } = req.query;

                        const response = await TEMPLATE_NOTI_COLL
                            .findById(templateID)
                            .populate('func')
                            .lean();

                        res.json(response);
                    }]
                }
            },

            [CF_ROUTINGS_TRIGGER_EVENT.CHECK_EXISTS_FUNCTIONS]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    post: [async function (req, res) {
                        const { module, model, func } = req.body;

                        const response = await FUNCTION_COLL.findOne({
                            name: func, module, model
                        });
                        res.json(response);
                    }]
                }
            },

            '/test-push-queue': {
                config: {
                    scopes: ['public'],
                    type: 'json'
                },
                methods: {
                    get: [async function (req, res) {
                        const { fullname, otp } = req.query;
                        const response = await TRIGGER_EVENT_MODEL.triggerEvent({
                            func: 'account.users.register',
                            receiver: ['userID'],
                            params: [
                                {
                                    key: 'fullname',
                                    value: fullname
                                },
                                {
                                    key: 'otp',
                                    value: otp
                                },
                            ]
                        });

                        res.json(response);
                    }]
                }
            },

            '/send-sms': {
                config: {
                    scopes: ['public'],
                    type: 'json'
                },
                methods: {
                    get: [async function (req, res) {
                        const { phone, code, type } = req.query;

                        const infoAfterSend = await SMS_MODEL.sendSMS({ phone, code, type });
                        return res.json({ error: false, data: infoAfterSend });
                    }]
                }
            },

            '/send-fcm': {
                config: {
                    scopes: ['public'],
                    type: 'json'
                },
                methods: {
                    post: [async function (req, res) {
                        const { title, message, receiversID, body, senderID } = req.body;

                        const infoAfterSend = await FCM_MODEL.sendCloudMessaging({
                            title, message, receiversID, body, senderID
                        });
                        return res.json({ error: false, data: infoAfterSend });
                    }]
                }
            },

            '/send-email': {
                config: {
                    scopes: ['public'],
                    type: 'json'
                },
                methods: {
                    post: [async function (req, res) {
                        const { from, to, subject, content, attachments, type } = req.body;

                        const infoAfterSend = await EMAIL_MODEL.sendEmail({
                            from, to, subject, content, attachments, type
                        });
                        return res.json({ error: false, data: infoAfterSend });
                    }]
                }
            },

            '/send-socket': {
                config: {
                    scopes: ['public'],
                    type: 'json'
                },
                methods: {
                    post: [async function (req, res) {
                        const { socketName, body } = req.body;

                        const infoAfterSend = await SOCKET_MODEL.sendSocket({
                            socketName, body
                        });
                        return res.json({ error: false, data: infoAfterSend });
                    }]
                }
            },

        }
    }
};
