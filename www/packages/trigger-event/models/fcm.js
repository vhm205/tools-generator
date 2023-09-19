"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * INTERNAL PACKAGE
 */

/**
 * CONSTANTS
 */

/**
 * BASE
 */

/**
 * MODULE
 */
const { sendMessageMobile }     = require('../../../fcm/utils');

/**
 * MODELS, COLLECTIONS
 */


class Model {
    constructor() {}

    /**
     * Send Cloud messaging
     * @param {string} title
     * @param {string} message
     * @param {ObjectID[]} receiversID
     * @param {string} body
     * @param {ObjectID} senderID
     * @this {Model}
     * @returns {Promise}
     */
    sendCloudMessaging({ title, message, receiversID, body, senderID }){
        return new Promise(async resolve => {
            try {
                const infoAfterSendCloudMessage = await sendMessageMobile({
                    title, message, receiversID, body, senderID
                });

                return resolve({ error: false, data: infoAfterSendCloudMessage });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

module.exports.MODEL = new Model;
