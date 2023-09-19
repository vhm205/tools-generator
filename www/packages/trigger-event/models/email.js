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
const { TYPE_EMAIL }        = require('../constants'); 

/**
 * MODULE
 */
const { sendMailDynamic }   = require('../../../mailer/module/mail_user');


class Model {
    /**
     * Send email
     * @param {string} from
     * @param {string} to
     * @param {string} subject
     * @param {string} content
     * @param {array} attachments
     * @param {string} type
     * @this {Model}
     * @returns {Promise}
     */
    sendEmail({ from, to, subject, content, attachments, type }){
        return new Promise(async resolve => {
            try {
                switch (type) {
                    case TYPE_EMAIL.NORMAL:
                        await this.sendEmailNormal({ from, to, subject, content, attachments });
                        break;
                    case TYPE_EMAIL.MAILJET:
                        await this.sendEmailJet({ from, to, subject, content, attachments });
                        break;
                    default:
                        break;
                }

                return resolve({ error: false, message: 'Send email thành công' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendEmailNormal({ from, to, subject, content, attachments }){
        return new Promise(async resolve => {
            try {
                await sendMailDynamic({ from, to, subject, content, attachments });
                // mailer({
                //     from, to, subject, content, attachments,
                //     callback: params => resolve(params)
                // })
                return resolve({ error: false, message: 'success' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendEmailJet({ from, to, subject, content, attachments }){
        return new Promise(async resolve => {
            try {
                // ...
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

module.exports.MODEL = new Model;
