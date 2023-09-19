"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * INTERNAL PACKAGE
 */
const {
    betweenTwoDateResultMinute,
    betweenTwoDateResultSeconds
} = require('../../../utils/time_utils');
const { randomStringFixLengthCode } = require('../../../utils/string_utils');

/**
 * CONSTANTS
 */
const { TYPE_SMS } = require('../constants');
const {
    // FIBO
    FIBO_DOMAIN,
    CLIENT_FIBO_NO,
    CLIENT_FIBO_PASSWORD,
    SENDER_FIBO_NAME,
    // AUTHY
    URL_AUTHY,
    AUTHY_API_KEY,
    // VNPT
    VNPT_DOMAIN,
    VNPT_USERNAME,
    VNPT_PASSWORD,
    VNPT_BRANDNAME,
} = process.env;

/**
 * BASE
 */
// const BaseModel 					            = require('../../../models/intalize/base_model');

/**
 * MODELS, COLLECTIONS
 */
const { OTP_MODEL, OTP_COLL, OTP_AUTHY_COLL }    = require('../../account');


class Model {
    constructor() {
        // Chu kỳ là 2 phút gửi 1 lần
        this.MINUTE_FOR_CYCLE = 2;
    }

    requestCreateAuthyUser({ email, phone }){
        return new Promise(async resolve => {
            const options = { 
                method: 'POST',
                url: `${URL_AUTHY}/protected/json/users/new`,
                headers: { 
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Authy-API-Key': AUTHY_API_KEY
                },
                form: { 
                    'user[email]': email,
                    'user[cellphone]': phone,
                    'user[country_code]': '84'
                }
            };

            request(options, (error, response, body) => {
                resolve({ error, response, body });
            });
        })
    }

    requestSendSMSAuthy({ authyID }){
        return new Promise(async resolve => {
            const options = { 
                method: 'GET',
                url: `${URL_AUTHY}/protected/json/sms/${authyID}`,
                qs: { locale: 'vi', force: 'true' },
                headers: { 
                    'cache-control': 'no-cache',
                    'X-Authy-API-Key': AUTHY_API_KEY 
                }
            };

            request(options, (error, response, body) => {
                resolve({ error, response, body });
            });
        })
    }

    /**
     * Send SMS
     * @param {string} phone
     * @param {string} code
     * @param {string} type
     * @this {Model}
     * @returns {Promise}
     */
	sendSMS({ phone, code, type }) {
        return new Promise(async resolve => {
            try {
                switch (type) {
                    case TYPE_SMS.FIBO:
                        await this.sendOTPFibo({ phone, code });
                        break;
                    case TYPE_SMS.AUTHY:
                        await this.sendOTPAuthy({ phone });
                        break;
                    case TYPE_SMS.VNPT:
                        await this.sendOTPVNPT({ phone })
                        break;
                    default:
                        break;
                }

                return resolve({ error: false, message: 'Send OTP success'});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendOTPFibo({ phone, code }) {
        return new Promise(async resolve => {
            try {
                const message = `Ma xac thuc OTP cua Quy khach tai ung dung Yen Sao Thien Viet la ${code}. Ma OTP co hieu luc trong 2 phut. Vui long khong cung cap OTP cho bat ky ai.`;
                const smsGUID     = 0;
                const serviceType = 0;

                const options = {
                    'method': 'GET',
                    'url': `${FIBO_DOMAIN}/SendMT/service.asmx/SendMaskedSMS?clientNo=${CLIENT_FIBO_NO}&clientPass=${CLIENT_FIBO_PASSWORD}&senderName=${SENDER_FIBO_NAME}&phoneNumber=${phone}&smsMessage=${message}&smsGUID=${smsGUID}&serviceType=${serviceType}`,
                    'headers': {}
                };

                request(options, function (error, response) {
                    if (error) throw new Error(error);
                    return resolve(response);
                });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendOTPAuthy({ phone }) {
        return new Promise(async (resolve) => {
            try {
                const infoUser = await OTP_AUTHY_COLL.findOne({
                    phone, 
                    authyID: { $ne: '' }
                });

                const numberRandom = randomStringFixLengthCode(8);
                const emailSender  = `user_${numberRandom}@gmail.com`;

                if (infoUser) {
                    const currentTime = Date.now();
                    const minuteHasSub = betweenTwoDateResultMinute(infoUser.modifyAt, new Date(currentTime));
                    const secondsHasSub = betweenTwoDateResultSeconds(infoUser.modifyAt, new Date(currentTime));

                    if (minuteHasSub < this.MINUTE_FOR_CYCLE) {
                        return resolve({ 
                            error: true,
                            message: `OTP được gửi ${this.MINUTE_FOR_CYCLE} phút/1 lần, vui lòng chờ ${ 2 * 60 - secondsHasSub} giây còn lại`, 
                            minute_waited: minuteHasSub
                        })
                    }
                }

                if (!infoUser) {
                    const { error, body } = await this.requestCreateAuthyUser({ email: emailSender, phone });

                    if (error) throw new Error(error);
                    let responseCreateAuthyUser = JSON.parse(body);

                    if (responseCreateAuthyUser.success) {
                        /**
                         * CẬP NHẬT AUTHY USER VỪA TẠO CHO authyID 
                         */
                        const infoAfterInsert = await OTP_MODEL.createAuthyUser({ phone, authyID: resp.user.id });

                        if (infoAfterInsert.error) 
                            return resolve({ error: true, message: "Không thể tạo authy ID" });

                        /**
                         * SEND SMS WITH AUTH_ID
                         */
                        const { error, body } = await this.requestSendSMSAuthy({ authyID: resp.user.id });

                        if (error) throw new Error(error);
                        let responseSendSMS = JSON.parse(body);

                        if (responseSendSMS.success) {
                            return resolve({ error: false, message: 'Send OTP success' });
                        }

                        return resolve({ error: true, message: 'Send OTP failed' });
                    }

                    const { error_code } = responseCreateAuthyUser;
                    switch(+error_code) {
                        case 60016:
                            await OTP_AUTHY_COLL.findOneAndUpdate({ phone }, {
                                authyID: ''
                            });
                            break;
                            // return await this.sendOTP({ phone });
                        case 60003:
                            return resolve({ error: true, message: 'DNS không hợp lệ' });
                        case 60010:
                            return resolve({ error: true, message: "Ứng dụng đã đạt đến giới hạn sms hàng ngày" });
                        default:
                            return resolve({ error: true, message: 'Send OTP failed' });
                    }
                } else {
                    const { error, body } = await this.requestSendSMSAuthy({ authyID: infoUser.authyID });

                    if (error) throw new Error(error);
                    let responseSendSMS = JSON.parse(body);

                    if (responseSendSMS.success) {
                        /**
                         * CẬP NHẬT AUTHY USER VỪA TẠO CHO authyID 
                         */
                        const INACTIVE_STATUS = 0;
                        const dataUpdate = { isActive: INACTIVE_STATUS };
                        const infoAfterUpdate = await OTP_MODEL.updateAuthyUser({ phone, dataUpdate });

                        if (infoAfterUpdate.error) 
                            return resolve(infoAfterUpdate);

                        return resolve({ error: false, message: 'Send OTP success' });
                    }

                    let { error_code } = responseSendSMS;
                    switch(+error_code) {
                        case 60016:
                            await OTP_AUTHY_COLL.findOneAndUpdate({ phone }, {
                                authyID: ''
                            }, { new: true });
                            break;
                            // return await this.sendOTP({ phone });
                        case 60003:
                            return resolve({ error: true, message: 'DNS không hợp lệ' });
                        case 60010:
                            return resolve({ error: true, message: "Ứng dụng đã đạt đến giới hạn sms hàng ngày" });
                        default:
                            return resolve({ error: true, message: 'Send OTP failed' });
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    sendOTPVNPT({ phone }) {
        return new Promise(async resolve => {
            let infoOTPLatestOFUser = await OTP_COLL
                .findOne({ phone })
                .sort({ _id: -1 })

            if (!infoOTPLatestOFUser) 
                return resolve({ error: true, message: 'Không tìm thấy mã OTP' });

            let { code } = infoOTPLatestOFUser;

            try {
                const options = {
                    'method': 'POST',
                    'url': `${VNPT_DOMAIN}/api/sendsms`,
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "username": VNPT_USERNAME,
                        "password": VNPT_PASSWORD,
                        "phonenumber": phone,
                        "brandname": VNPT_BRANDNAME,
                        "message": `${code} là mã kích hoạt của bạn`,
                        "type": "0"
                    })
                };

                request(options, function (error, response) {
                    console.log({ error, response })
                    if (error)
                        return resolve({ error: true, message: error.message });

                    return resolve({ error: false, data: response.body });
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

}

module.exports.MODEL = new Model;
