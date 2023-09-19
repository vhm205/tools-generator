"use strict";

/**
 * EXTERNAL PACKAGES
 */
const ObjectID                      = require('mongoose').Types.ObjectId;
const jwt                           = require('jsonwebtoken');
const { hash, hashSync, compare }   = require('bcryptjs');

/**
 * INTERNAL PACKAGES
 */
const cfJWS                         = require('../../../config/cf_jws');
const { validEmail, validUserName }	= require('../../../utils/string_utils');

/**
 * BASES
 */
const BaseModel 					= require('../../../models/intalize/base_model');

/**
 * COLLECTIONS
 */
const USER_COLL  					= require('../databases/user-coll');


class Model extends BaseModel {
    constructor() {
        super(USER_COLL);
    }

    /**
     * Tạo mới user
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @param {array} roles
     * @param {enum} status
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

                let emailValid      = email.toLowerCase().trim();
                let usernameValid   = username.trim();

				if(!validEmail(emailValid))
					return resolve({ error: true, message: 'Email không hợp lệ' });

                if(!validUserName(usernameValid))
					return resolve({ error: true, message: 'Username không hợp lệ' });

                let checkEmailExist = await USER_COLL.findOne({ email: emailValid });
                if(checkEmailExist)
                    return resolve({ error: true, message: "Email đã tồn tại" });

                let checkUsernameExist = await USER_COLL.findOne({ username: usernameValid });
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

	update({ userID, fullname, username, password, status, role }) {
        return new Promise(async resolve => {
            try {
                let dataUpdateUser = {};

                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                let checkExists = await USER_COLL.findById(userID);
                if(!checkExists)
                    return resolve({ error: true, message: "Người dùng không tồn tại" });

                if(username){
                    if(checkExists.username !== username){
                        let checkUsernameExist = await USER_COLL.findOne({ username: username.trim() });
                        if(checkUsernameExist)
                            return resolve({ error: true, message: "Username đã tồn tại" });
                    }

                    dataUpdateUser.username = username;
                }

                if(role && ObjectID.isValid(role)){
                    dataUpdateUser.roles = [role];
                }

                fullname && (dataUpdateUser.fullname = fullname);
                password && (dataUpdateUser.password = hashSync(password, 8));

				if([1,2].includes(+status)){
					dataUpdateUser.status = status;
				}

                await this.updateWhereClause({ _id: userID }, dataUpdateUser);
                password && delete dataUpdateUser.password;

                return resolve({ error: false, data: dataUpdateUser });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    delete({ userID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

				let infoAfterDelete = await USER_COLL.findByIdAndDelete(userID);
                if(!infoAfterDelete)
                    return resolve({ error: true, message: "Không thể xoá người dùng" });

                return resolve({ error: false, data: infoAfterDelete });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfo({ userID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(userID))
                    return resolve({ error: true, message: "ID user không hợp lệ" });

                let infoUser = await USER_COLL.findById(userID).populate('roles').lean();
                if(!infoUser)
                    return resolve({ error: true, message: "Người dùng không tồn tại" });

                return resolve({ error: false, data: infoUser });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

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
                        }
                    }]
                }

                let listUsers = await USER_COLL.aggregate([
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

    signIn({ account, password }) {
        return new Promise(async resolve => {
            try {
                if(!account || !password)
                    return resolve({ error: true, message: 'Bạn cần nhập đầy đủ tên đăng nhập và mật khẩu' });

                let infoAccount = await USER_COLL.findOne({
                    $or: [
                        { email: account.trim() },
                        { username: account.trim() }
                    ]
                });

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

}

exports.MODEL = new Model;
