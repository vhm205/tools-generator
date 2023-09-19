"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                              = require('mongoose').Types.ObjectId;
const jwt                                   = require('jsonwebtoken');
const { hash, hashSync, compare }           = require('bcryptjs');

/**
 * INTERNAL PACKAGE
 */
const cfJWS                                 = require('../../../config/cf_jws');
const { validEmail, validUserName }	        = require('../../../utils/string_utils');
const { getCurrentTime }	                = require('../../../utils/time_utils');
const { checkPhoneNumber, checkObjectIDs }  = require('../../../utils/utils');
const BaseModel 					        = require('../../../models/intalize/base_model');

/**
 * CONSTANTS
 */
const { 
    ACCOUNT_TYPE,
    GENDER_TYPE
} = require('../constants');

/**
 * MODELS
 */
const OTP_MODEL 					    = require('./otp').MODEL;
// const TRIGGER_EVENT_MODEL		        = require('../../trigger-notification/models/event').MODEL;

/**
 * COLLECTIONS
 */
const ACCOUNT_COLL  					= require('../databases/account/account-coll');
const ACCOUNT_TOKEN__COLL  		        = require('../databases/account/account_token-coll');


class Model extends BaseModel {
    constructor() {
        super(ACCOUNT_COLL);

        this.STATUS_USER_ACTIVE     = 1;
        this.STATUS_USER_INACTIVE   = 2;

        this.NORMAL_ACCOUNT     = 'normal';
        this.FACEBOOK_ACCOUNT   = 'facebook';
        this.GOOGLE_ACCOUNT     = 'google';
        this.APPLE_ACCOUNT      = 'apple';
    }

    /**
     * ========================== ********* ================================
     * ========================== AUTH USER ================================
     * ========================== ********* ================================
     */

    /**
     * Lấy loại tài khoản social
     * @param {string} type
     * @param {string} uid
     * @this {BaseModel}
     * @returns {Object}
     */
    getTypeAccountSocial(type, uid){
        const data = {};

        switch (type) {
            case this.FACEBOOK_ACCOUNT:
                data.facebookUID = uid;
                break;
            case this.GOOGLE_ACCOUNT:
                data.googleUID = uid;
                break;
            case this.APPLE_ACCOUNT:
                data.appleUID = uid;
                break;
            default:
                return { error: true, message: 'Loại tài khoản không hợp lệ' };
        }

        return { error: false, data };
    }

    /**
     * Đăng ký tài khoản thường
     * @param {string} username
     * @param {string} fullname
     * @param {string} email
     * @param {string} phone
     * @param {string} code
     * @param {string} password
     * @param {string} confirmPassword
     * @param {objectID} otpID
     * @this {BaseModel}
     * @returns {Promise}
     */
    registerNormal({ username, fullname, email, phone, password, confirmPassword, otpID }){
        return new Promise(async resolve => {
            try {
                // Init variable 
                let dataInsert = {
                    phone,
                    status: this.STATUS_USER_ACTIVE,
                    type: this.NORMAL_ACCOUNT
                }

                // Validate phone
                if(!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                if(!checkObjectIDs(otpID))
                    return resolve({ error: true, message: 'OTP không hợp lệ' });

                // Check verify otp
                const infoOTP = await OTP_MODEL.checkOTPExist({ 
                    otpID, 
                    type: OTP_MODEL.TYPE_REGISTER,
                    status: OTP_MODEL.STATUS_VERIFIED
                })

                if(infoOTP.error)
                    return resolve({ error: true, message: "Số điện thoại chưa được xác minh" });

                const checkExistPhone = await ACCOUNT_COLL.findOne({ phone }).lean();

                if(checkExistPhone) {
                    if(checkExistPhone.status !== this.STATUS_USER_ACTIVE)
                        return resolve({ error: true, message: 'Tài khoản có số điện thoại đã bị khóa' });

                    const infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(checkExistPhone._id, {
                        $addToSet: { type: this.NORMAL_ACCOUNT },
                    }, { new: true });

                    return resolve({
                        error: false,
                        data: infoAfterUpdate,
                        message: 'Số điện thoại đã tồn tại, vui lòng xác nhận số điện thoại'
                    });
                }

                // Validate email
                if(email){
                    if(!validEmail(email))
                        return resolve({ error: true, message: 'Email không hợp lệ' });

                    let checkEmailExist = await ACCOUNT_COLL
                        .findOne({ email, type: 'normal' })
                        .select('_id');

                    if(checkEmailExist)
                        return resolve({ error: true, message: "Email đã tồn tại" });

                    dataInsert.email = email;
                }

                // Validate username
                if(username){
                    if(!validUserName(username))
                        return resolve({ error: true, message: 'Username không hợp lệ' });

                    let checkUsernameExist = await ACCOUNT_COLL
                        .findOne({ username, type: 'normal' })
                        .select('_id');

                    if(checkUsernameExist)
                        return resolve({ error: true, message: "Username đã tồn tại" });

                    dataInsert.username = username;
                }

                // Validate password
                if(password){
                    if(password !== confirmPassword)
                        return resolve({ error: true, message: 'Xác nhận mật khẩu không khớp' });

                    let hashPassword = await hash(password, 8);
                    if (!hashPassword)
                        return resolve({ error: true, message: 'Không thể hash password' });

                    dataInsert.password = hashPassword;
                }

                fullname && (dataInsert.fullname = fullname);

                let infoAfterRegister = await this.insertData(dataInsert);

                if(!infoAfterRegister)
                    return resolve({ error: true, message: 'Đăng ký thất bại' });

                return resolve({ error: false, data: infoAfterRegister });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Đăng ký tài khoản social
     * @param {string} UID
     * @param {string?} fullname
     * @param {string?} email
     * @param {string} phone
     * @param {string} type
     * @param {objectID} otpID
     * @this {BaseModel}
     * @returns {Promise}
     */
    registerSocial({ uid, fullname, email, phone, type, otpID }){
        return new Promise(async resolve => {
            try {
                // Init variable 
                let dataInsert = {
                    fullname,
                    email,
                    phone,
                    type,
                    status: this.STATUS_USER_ACTIVE
                }

                // Validate common
                if(!ACCOUNT_TYPE.includes(type))
                    return resolve({ error: true, message: 'Loại tài khoản không hợp lệ' });

                if(!uid)
                    return resolve({ error: true, message: 'UID không hợp lệ' });

                // Validate phone
                if(phone && !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                // Validate email
                if(email && !validEmail(email))
                    return resolve({ error: true, message: 'Email không hợp lệ' });

                // Check verify otp
                const infoOTP = await OTP_MODEL.checkOTPExist({ 
                    otpID, 
                    type: OTP_MODEL.TYPE_REGISTER,
                    status: OTP_MODEL.STATUS_VERIFIED
                })

                if(infoOTP.error)
                    return resolve({ error: true, message: "Số điện thoại chưa được xác minh" });

                const checkExistPhone = await ACCOUNT_COLL.findOne({ phone }).lean();

                if(checkExistPhone) {
                    if(checkExistPhone.status !== this.STATUS_USER_ACTIVE)
                        return resolve({ error: true, message: 'Tài khoản có số điện thoại đã bị khóa' });

                    const { error, data } = this.getTypeAccountSocial(type, uid);
                    if(error)
                        return resolve({ error: true, message: 'Loại tài khoản không hợp lệ' });

                    const infoAfterUpdateType = await ACCOUNT_COLL.findByIdAndUpdate(checkExistPhone._id, {
                        $addToSet: { type },
                        $set: data
                    }, { new: true });

                    return resolve({
                        error: false,
                        data: infoAfterUpdateType,
                        message: 'Số điện thoại đã tồn tại, vui lòng xác nhận số điện thoại'
                    });
                }

                const { error, data } = this.getTypeAccountSocial(type, uid);
                if(error)
                    return resolve({ error: true, message: 'Loại tài khoản không hợp lệ' });

                let infoAfterRegister = await this.insertData({ ...dataInsert, ...data });

                if(!infoAfterRegister)
                    return resolve({ error: true, message: 'Đăng ký thất bại' });

                return resolve({ error: false, data: infoAfterRegister });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Đăng nhập tài khoản thường
     * @param {string} account
     * @param {string} password
     * @this {BaseModel}
     * @returns {Promise}
     */
    loginNormal({ account, password }) {
        return new Promise(async resolve => {
            try {
                if(!account || !password)
                    return resolve({ error: true, message: 'Bạn cần nhập đầy đủ tên đăng nhập và mật khẩu' });

                let infoAccount = await ACCOUNT_COLL.findOne({
                    $or: [
                        { email: account.trim() },
                        { username: account.trim() },
                        { phone: account.trim() },
                    ]
                }).lean();

                if (!infoAccount)
                    return resolve({ error: true, message: 'Tài khoản không tồn tại' });

				if (infoAccount.status === 2)
                    return resolve({ error: true, message: 'Người dùng đã bị khoá' });

                let isMatchPass = await compare(password, infoAccount.password);
                if (!isMatchPass)
                    return resolve({ error: true, message: 'Mật khẩu không trùng khớp' });

                let infoUser = {
                    _id: infoAccount._id,
                    username: infoAccount.username,
                    fullname: infoAccount.fullname,
                    email: infoAccount.email,
                    phone: infoAccount.phone,
                    type: infoAccount.type,
                    status: infoAccount.status,
                    roles: infoAccount.roles?.map(role => role.toString()),
                    permissions: infoAccount.permissions,
                    language: infoAccount.language,
                }
                let token = jwt.sign(infoUser, cfJWS.secret);

                return resolve({
                    error: false,
                    data: { user: infoUser, token }
                });
            } catch (error) {
                console.error(error)
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Đăng nhập tài khoản social
     * @param {string} uid
     * @param {string} token
     * @param {string} type
     * @this {BaseModel}
     * @returns {Promise}
     */
    loginSocial({ uid, accessToken }) {
        return new Promise(async resolve => {
            try {
                if(!uid)
                    return resolve({ error: true, message: 'UID không hợp lệ' });

                let infoAccount = await ACCOUNT_COLL.findOne({
                    $or: [
                        { facebookUID: uid.trim() },
                        { googleUID: uid.trim() },
                        { appleUID: uid.trim() },
                    ]
                }).lean();

                if (!infoAccount)
                    return resolve({ error: true, message: 'Tài khoản không tồn tại' });

				if (infoAccount.status === this.STATUS_USER_INACTIVE)
                    return resolve({ error: true, message: 'Người dùng đã bị khoá' });

                if(accessToken){
                    await ACCOUNT_TOKEN__COLL.create({
                        account: infoAccount._id,
                        token: accessToken,
                        createAt: getCurrentTime()
                    })
                }

                let infoUser = {
                    _id: infoAccount._id,
                    username: infoAccount.username,
                    fullname: infoAccount.fullname,
                    email: infoAccount.email,
                    phone: infoAccount.phone,
                    type: infoAccount.type,
                    status: infoAccount.status,
                    roles: infoAccount.roles?.map(role => role.toString()),
					permissions: infoAccount.permissions,
                    language: infoAccount.language,
                }
                let token = jwt.sign(infoUser, cfJWS.secret);

                return resolve({
                    error: false,
                    data: { user: infoUser, token }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Đăng nhập tài khoản với SMS
     * @param {string} phone
     * @param {string} code
     * @this {BaseModel}
     * @returns {Promise}
     */
    loginOTP({ phone, code }) {
        return new Promise(async resolve => {
            try {
                if(!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: 'Số điện thoại không hợp lệ' });

                if(!code)
                    return resolve({ error: true, message: 'OTP không hợp lệ' });

                let infoAccount = await ACCOUNT_COLL
                    .findOne({ phone })
                    .lean();

                if (!infoAccount)
                    return resolve({ error: true, message: 'Tài khoản không tồn tại' });

				if (infoAccount.status === this.STATUS_USER_INACTIVE)
                    return resolve({ error: true, message: 'Người dùng đã bị khoá' });

                // Verify code otp
                const verifyOTP = await OTP_MODEL.verifyOTP({ phone, code, type: OTP_MODEL.TYPE_LOGIN });
                if(verifyOTP.error)
                    return resolve(verifyOTP);

                let infoUser = {
                    _id: infoAccount._id,
                    username: infoAccount.username,
                    fullname: infoAccount.fullname,
                    email: infoAccount.email,
                    phone: infoAccount.phone,
                    type: infoAccount.type,
                    status: infoAccount.status,
                    roles: infoAccount.roles?.map(role => role.toString()),
					permissions: infoAccount.permissions,
                    language: infoAccount.language,
                }
                let token = jwt.sign(infoUser, cfJWS.secret);

                return resolve({
                    error: false,
                    data: { user: infoUser, token }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật mật khẩu cho user
     * @param {objectID} userID
     * @param {string} password
     * @param {string} confirmPassword
     * @this {BaseModel}
     * @returns {Promise}
     */
    updatePassword({ userID, password, confirmPassword }){
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                if(!password || !confirmPassword)
                    return resolve({ error: true, message: "Bạn cần nhập mật khẩu và xác nhận mật khẩu" });

                if(password !== confirmPassword)
                    return resolve({ error: true, message: "Mật khẩu không trùng khớp" });

                const infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(userID, {
                    password: hashSync(password, 8),
                    modifyAt: getCurrentTime()
                }).lean();

                delete infoAfterUpdate.password;

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Quên mật khẩu user
     * @param {string} account
     * @param {string} password
     * @param {string} confirmPassword
     * @this {BaseModel}
     * @returns {Promise}
     */
    forgotPassword({ account, password, confirmPassword, otpID }){
        return new Promise(async resolve => {
            try {
                if(!account || !password)
                    return resolve({ error: true, message: 'Bạn cần nhập đầy đủ tên đăng nhập và mật khẩu' });

                let infoAccount = await ACCOUNT_COLL.findOne({
                    $or: [
                        { email: account.trim() },
                        { username: account.trim() },
                        { phone: account.trim() },
                    ]
                }).lean();

                if(!infoAccount)
                    return resolve({ error: true, message: "Tài khoản không tồn tại" });

                // Check verify otp
                const infoOTP = await OTP_MODEL.checkOTPExist({ 
                    otpID, 
                    type: OTP_MODEL.TYPE_FORGET_PASS,
                    status: OTP_MODEL.STATUS_VERIFIED
                })

                if(infoOTP.error)
                    return resolve({ error: true, message: "Số điện thoại chưa được xác minh" });

                if(!password || !confirmPassword)
                    return resolve({ error: true, message: "Bạn cần nhập mật khẩu và xác nhận mật khẩu" });

                if(password !== confirmPassword)
                    return resolve({ error: true, message: "Mật khẩu không trùng khớp" });

                const infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(infoAccount._id, {
                    password: hashSync(password, 8),
                    modifyAt: getCurrentTime()
                }, { new: true }).lean();

                delete infoAfterUpdate.password;

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }


    /**
     * ========================== ************* ================================
     * ========================== QUẢN LÝ USER  ================================
     * ========================== ************* ================================
     */

    /**
     * Tạo mới user
     * @param {string} fullname
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @param {string} confirmPassword
     * @param {objectID} role
     * @param {number} status
     * @this {BaseModel}
     * @returns {Promise}
     */
	insert({ fullname, username, email, password, confirmPassword, role, status = 1 }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(role))
                    return resolve({ error: true, message: "ID role không hợp lệ" });

                if(!username || !email)
                    return resolve({ error: true, message: 'Vui lòng nhập đầy đủ username và email' });

                let emailValid      = email.trim();
                let usernameValid   = username.trim();

				if(!validEmail(emailValid))
					return resolve({ error: true, message: 'Email không hợp lệ' });

                if(!validUserName(usernameValid))
					return resolve({ error: true, message: 'Username không hợp lệ' });

                let checkEmailExist = await ACCOUNT_COLL.findOne({ email: emailValid });
                if(checkEmailExist)
                    return resolve({ error: true, message: "Email đã tồn tại" });

                let checkUsernameExist = await ACCOUNT_COLL.findOne({ username: usernameValid });
                if(checkUsernameExist)
                    return resolve({ error: true, message: "Username đã tồn tại" });

				if(![1,2].includes(+status))
					return resolve({ error: true, message: "Trạng thái không hợp lệ" });

				if(!password)
					return resolve({ error: true, message: 'Vui lòng nhập mật khẩu' });

                if(password !== confirmPassword)
					return resolve({ error: true, message: 'Xác nhận mật khẩu không khớp' });

                let hashPassword = await hash(password, 8);
				if (!hashPassword)
					return resolve({ error: true, message: 'Không thể hash password' });

                let dataInsert = {
                    fullname,
                    email: emailValid,
                    username: usernameValid,
					password: hashPassword,
					status,
					roles: [role],
                }

                let infoAfterInsert = await this.insertData(dataInsert);

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Tạo admin thất bại' });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật user
     * @param {objectID} userID
     * @param {string} fullname
     * @param {string} username
     * @param {object} birthday
     * @param {string} gender
     * @param {string} language
     * @param {number} status
     * @param {objectID} role
     * @this {BaseModel}
     * @returns {Promise}
     */
	update({ userID, fullname, username, birthday, gender, language, status, role }) {
        return new Promise(async resolve => {
            try {
                let dataUpdateUser = {};

                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                if(gender && !GENDER_TYPE.includes(gender))
                    return resolve({ error: true, message: "Giới tính không hợp lệ" });

                let checkExists = await ACCOUNT_COLL.findById(userID);
                if(!checkExists)
                    return resolve({ error: true, message: "Người dùng không tồn tại" });

                if(username){
                    if(checkExists.username !== username){
                        let checkUsernameExist = await ACCOUNT_COLL.findOne({ username: username.trim() });
                        if(checkUsernameExist)
                            return resolve({ error: true, message: "Username đã tồn tại" });
                    }

                    dataUpdateUser.username = username;
                }

                if(role && ObjectID.isValid(role)){
                    dataUpdateUser.roles = [role];
                }

                fullname && (dataUpdateUser.fullname = fullname);
                language && (dataUpdateUser.language = language);
                gender   && (dataUpdateUser.gender   = gender);
                birthday && (dataUpdateUser.birthday = birthday);

				if([1,2].includes(+status)){
					dataUpdateUser.status = status;
				}

                await this.updateWhereClause({ _id: userID }, dataUpdateUser);

                return resolve({ error: false, data: dataUpdateUser });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật avatar user
     * @param {objectID} userID
     * @param {objectID} avatarID
     * @this {BaseModel}
     * @returns {Promise}
     */
    updateAvatar({ userID, avatarID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(avatarID))
                    return resolve({ error: true, message: "ID avatar không hợp lệ" });

                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

				let infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(userID, {
                    $set: { avatar: avatarID }
                }, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Không thể cập nhật avatar người dùng" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật email user
     * @param {objectID} userID
     * @param {string} email
     * @this {BaseModel}
     * @returns {Promise}
     */
    updateEmail({ userID, email }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                if(!email || !validEmail(email))
                    return resolve({ error: true, message: "Email không hợp lệ" });

                const infoUser = await ACCOUNT_COLL.findById(userID).select('email');

                if(infoUser.email !== email){
                    let checkExistEmail = await ACCOUNT_COLL.findOne({ email: email.trim() });
                    if(checkExistEmail)
                        return resolve({ error: true, message: "Email đã tồn tại" });
                }

				let infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(userID, {
                    $set: { email }
                }, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Không thể cập nhật email người dùng" });

                // TRIGGER_EVENT_MODEL.triggerEvent({
                //     func: 'ACCOUNT.ACCOUNT.updateEmail',
                //     receiver: [userID]
                // });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật phone user
     * @param {objectID} userID
     * @param {string} phone
     * @this {BaseModel}
     * @returns {Promise}
     */
    updatePhone({ userID, phone, otpID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                if(!ObjectID.isValid(otpID))
                    return resolve({ error: true, message: "ID otp không hợp lệ" });

                if(!phone || !checkPhoneNumber(phone))
                    return resolve({ error: true, message: "Số điện thoại không hợp lệ" });

                const infoUser = await ACCOUNT_COLL.findById(userID);

                if(infoUser.phone !== phone){
                    let checkExists = await ACCOUNT_COLL.findOne({ phone: phone.trim() }).select('_id');
                    if(checkExists)
                        return resolve({ error: true, message: "Số điện thoại đã được đăng ký" });
                }

                // Check verify otp
                const infoOTP = await OTP_MODEL.checkOTPExist({ 
                    otpID, 
                    type: OTP_MODEL.TYPE_UPDATE_PHONE,
                    status: OTP_MODEL.STATUS_VERIFIED
                })

                if(infoOTP.error)
                    return resolve({ error: true, message: "Số điện thoại chưa được xác minh" });

				let infoAfterUpdate = await ACCOUNT_COLL.findByIdAndUpdate(userID, {
                    $set: { phone }
                }, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Không thể cập nhật số điện thoại người dùng" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Cập nhật device user
     * @param {objectID} userID
     * @param {string} deviceName
     * @param {string} deviceType
     * @param {string} deviceID
     * @param {string} fcmToken
     * @this {BaseModel}
     * @returns {Promise}
     */
    updateDevice({ userID, deviceName, deviceType, deviceID, fcmToken }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                if(!deviceName || !deviceID || !fcmToken)
                    return resolve({ error: true, message: "deviceName, deviceID hoặc fcmToken không hợp lệ" });

				let infoAfterUpdate = await ACCOUNT_COLL.findOneAndUpdate({ 
                    _id: userID,
                    "devices.deviceID": { $ne: deviceID }
                }, {
                    $addToSet: {
                        devices: {
                            deviceName,
                            deviceType,
                            deviceID,
                            fcmToken
                        }
                    }
                }, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Không thể cập nhật device người dùng" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Xóa user
     * @param {objectID} userID
     * @this {BaseModel}
     * @returns {Promise}
     */
    delete({ userID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

				let infoAfterDelete = await ACCOUNT_COLL.findByIdAndDelete(userID);
                if(!infoAfterDelete)
                    return resolve({ error: true, message: "Không thể xoá người dùng" });

                return resolve({ error: false, data: infoAfterDelete });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Lấy thông tin user
     * @param {objectID} userID
     * @this {BaseModel}
     * @returns {Promise}
     */
    getInfo({ userID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                let infoUser = await ACCOUNT_COLL.findById(userID).populate('roles').lean();
                if(!infoUser)
                    return resolve({ error: true, message: "Người dùng không tồn tại" });

                return resolve({ error: false, data: infoUser });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Lấy danh sách user
     * @param {number} status
     * @param {string} keyword
     * @this {BaseModel}
     * @returns {Promise}
     */
	getList({ status, keyword }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {
                    ...!!status && { status },
                    "roles.name": { $ne: 'SUPERVISOR' }
                }

                if(keyword){
                    let key = keyword.split(" ");
                    key = '.*' + key.join(".*") + '.*';

                    conditionObj.$or = [{
                        fullname: {
                            $regex: key,
                            $options: 'i'
                        },
                        username: {
                            $regex: key,
                            $options: 'i'
                        },
                        email: {
                            $regex: key,
                            $options: 'i'
                        },
                        phone: {
                            $regex: key,
                            $options: 'i'
                        }
                    }]
                }

                let listUsers = await ACCOUNT_COLL.aggregate([
                    {
                        $lookup: {
                            from: "role_bases",
                            localField: "roles",
                            foreignField: "_id",
                            as: "roles"
                         }
                    },
                    {
                        $match: conditionObj
                    },
                    { $sort: { createAt: -1 } }
                ])

                if(!listUsers)
                    return resolve({ error: true, message: "Không thể lấy danh sách người dùng" });

                return resolve({ error: false, data: listUsers });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    checkAuthenticate({ accessToken }) {
        return new Promise(async resolve => {
            try {
                const infoAccount = await jwt.verify(accessToken, cfJWS.secret);

                const infoUser = {
                    _id: infoAccount._id,
                    username: infoAccount.username,
                    fullname: infoAccount.fullname,
                    email: infoAccount.email,
                    phone: infoAccount.phone,
                    type: infoAccount.type,
                    status: infoAccount.status,
                    roles: infoAccount.roles?.map(role => role.toString()),
					permissions: infoAccount.permissions,
                    language: infoAccount.language,
                }

                return resolve({
                    error: false,
                    data: infoUser
                });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
