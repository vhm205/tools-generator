"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * INTERNAL PACKAGE
 */
const { 
    addMinuteToDate,
    getCurrentTime,
    compareTwoTime,
    betweenTwoDateResultMinute,
    betweenTwoDateResultSeconds
} = require('../../../utils/time_utils');

const { checkPhoneNumber, checkObjectIDs }          = require('../../../utils/utils');
const { randomStringOnlyNumber }                    = require('../../../utils/string_utils');
const BaseModel                                     = require('../../../models/intalize/base_model');

/**
 * CONSTANTS
 */
const { 
    MINUTE_FOR_COMPARE,
    TIME_FOR_BORN_CODE,
    OTP_TYPE
} = require('../constants');

/**
 * COLLECTIONS
 */
const OTP_COLL  				                    = require('../databases/otp/otp-coll');
const OTP_AUTHY_COLL  				                = require('../databases/otp/otp_authy-coll');


class Model extends BaseModel {
    constructor() {
        super(OTP_COLL);
        this.TYPE_REGISTER          = 1;
        this.TYPE_LOGIN             = 2;
        this.TYPE_FORGET_PASS       = 3;
        this.TYPE_UPDATE_PHONE      = 4;

        this.STATUS_WAITING_VERIFY  = 0;
        this.STATUS_VERIFIED        = 1;
        this.STATUS_CANCEL_VERIFY   = 2;

        this.EXPIRE_TIME_INVALID    = 1;
    }

    /**
     * ========================== ********************* ================================
     * ========================== QUẢN LÝ OTP - NORMAL  ================================
     * ========================== ********************* ================================
     */

    createOTP({ phone, type }) {
        return new Promise(async resolve => {
            try {
                if(!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                if(!type || !OTP_TYPE.includes(+type))
                    return resolve({ error: true, message: 'Loại OTP không hợp lệ' });

                let infoOTPLatestOFUser = await OTP_COLL
                    .findOne({ phone, status: this.STATUS_WAITING_VERIFY })
                    .sort({ _id: -1 })
                    .lean();

                if (infoOTPLatestOFUser) { // đang có otp đang ở chế độ chờ verify
                    // kiểm tra đã hết 2 phút -> cho phép gửi tiếp
                    let currentTime = Date.now();
                    let minuteHasSub = betweenTwoDateResultMinute(infoOTPLatestOFUser.createAt, new Date(currentTime));
                    let secondsHasSub = betweenTwoDateResultSeconds(infoOTPLatestOFUser.createAt, new Date(currentTime));

                    if (minuteHasSub < MINUTE_FOR_COMPARE) {
                        return resolve({
                            error: true,
                            message: `OTP được gửi ${MINUTE_FOR_COMPARE} phút/1 lần, vui lòng chờ ${MINUTE_FOR_COMPARE * 60 - secondsHasSub} giây còn lại`,
                            minute_waited: minuteHasSub
                        })
                    }
                }

                // Cập nhật tât cả dữ liệu cũ là 2 - đã hết hạn
                await OTP_COLL.updateMany({ phone }, {
                    $set: {
                        status: this.STATUS_CANCEL_VERIFY
                    }
                });

                const AMOUNT_CHARATOR = 6;
                const codeGenerate = randomStringOnlyNumber(AMOUNT_CHARATOR);
                const now = Date.now();
                const expiredTime = addMinuteToDate(now, TIME_FOR_BORN_CODE);

                const infoAfterInsert = await this.insertData({
                    phone, type, code: codeGenerate, expiredTime, phone
                });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Không thể tạo OTP' });

                return resolve({ error: false, data: infoAfterInsert, expireTimeMinutes: TIME_FOR_BORN_CODE });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    verifyOTP({ phone, code, type }) {
        return new Promise(async resolve => {
            try {
                let checkExist = await OTP_COLL.findOne({ 
                    phone,
                    type,
                    code
                });
                if (!checkExist)
                    return resolve({ error: true, message: 'Mã không tồn tại' });

                if(checkExist.status !== this.STATUS_WAITING_VERIFY)
                    return resolve({ error: true, message: 'Mã đã được sử dụng' });

                const currentTime = new Date();
                const expireTime = checkExist.expiredTime;
                const expireTimeValid = compareTwoTime(currentTime, expireTime);

                if(expireTimeValid === this.EXPIRE_TIME_INVALID)
                    return resolve({ error: true, message: 'Mã đã hết hạn' });

                let infoAfterUpdateStatusOTP = await OTP_COLL.findByIdAndUpdate(checkExist._id, {
                    status: this.STATUS_VERIFIED,
                    modifyAt: getCurrentTime()
                }, { new: true })

                return resolve({ error: false, message: 'Xác thực thành công', data: infoAfterUpdateStatusOTP });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    checkOTPExist({ otpID, type, status }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(otpID))
                    return resolve({ error: true, message: 'ID otp không hợp lệ' });

                let checkExist = await OTP_COLL.findOne({ 
                    _id: otpID, 
                    status,
                    type
                });
                if (!checkExist)
                    return resolve({ error: true, message: 'Mã không tồn tại' });

                return resolve({ error: false, data: checkExist });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * ========================== ******************** ================================
     * ========================== QUẢN LÝ OTP - AUTHY  ================================
     * ========================== ******************** ================================
     */

    createAuthyUser({ phone, authyID }) {
        return new Promise(async resolve => {
            try {
                if (!authyID)
                    return resolve({ error: true, message: 'ID authy không hợp lệ' });

                if (!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                let infoAfterInsert = await OTP_AUTHY_COLL.create({
                    phone,
                    authyID,
                    createAt: getCurrentTime(),
                    modifyAt: getCurrentTime()
                });

                if (!infoAfterInsert)
                    return resolve({ error: true, message: 'Không thể tạo authy user' });

                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    updateAuthyUser({ phone, dataUpdate }) {
        return new Promise(async resolve => {
            try {
                if (!Object.keys(dataUpdate).length)
                    return resolve({ error: true, message: 'Dữ liệu cập nhật không hợp lệ' });

                if (!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                let infoAfterUpdate = await OTP_AUTHY_COLL.findOneAndUpdate({ phone }, {
                    ...dataUpdate,
                    modifyAt: getCurrentTime()
                }, { new: true });

                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Không thể cập nhật authy user' });

                return resolve({ error: false, data: infoAfterUpdate })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    verifyOTPAuthy({ phone, code }) {
        return new Promise(async resolve => {
            try {
                const infoUser = await OTP_AUTHY_COLL.findOne({ 
                    phone, 
                    authyID: { $ne: '' }
                });

                if (!infoUser) 
                    return resolve({ error: true, message: 'Số điện thoại không tồn tại hoặc chưa tạo account authy' });

                const optionRequestVerify = { 
                    method: 'GET',
                    url: `${URL_AUTHY}/protected/json/verify/${code}/${infoUser.authyID}`,
                    headers: {
                        'cache-control': 'no-cache',
                        'X-Authy-API-Key': AUTHY_API_KEY 
                    } 
                };

                request(optionRequestVerify, async (error, _, body) => {
                    if (error) throw new Error(error);
                    const resp = JSON.parse(body);

                    if (!resp.success) {
                        return resolve({ error: true, message: 'Verify Error' });
                    }

                    const ACTIVE_STATUS = 1;
                    const infoAfterUpdate = await OTP_AUTHY_COLL.findOneAndUpdate({ phone }, {
                        isActive: ACTIVE_STATUS,
                        modifyAt: new Date()
                    });

                    if (!infoAfterUpdate) 
                        return resolve({ error: true, message: 'Không thể cập nhật authy ID' });

                    return resolve({ error: false, message: 'Verify Success' });
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * ========================== ******************* ================================
     * ========================== QUẢN LÝ OTP - VNPT  ================================
     * ========================== ******************* ================================
     */

    verifyOTPVNPT({ phone, code }) {
        return new Promise(async resolve => {
            try {
                
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
