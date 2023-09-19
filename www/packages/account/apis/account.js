"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                           = require('../../../routing/child_routing');
const { CF_ROUTINGS_ACCOUNT }               = require('../constants/account.uri');

/**
 * MODELS
 */
const ACCOUNT_MODEL 					    = require('../models/account').MODEL;
const OTP_MODEL 							= require('../models/otp').MODEL;
const IMAGE_MODEL 							= require('../../image/models/image').MODEL;

/**
 * COLLECTIONS
 */
const ROLE_BASE__COLL                       = require('../../auth/databases/role_base-coll');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ************ ================================
             * ========================== AUTH ACCOUNT ================================
             * ========================== ************ ================================
             */

            /**
             * Function: Generate code OTP (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.GENERATE_CODE_OTP]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async (req, res) => {
                        const { phone, type } = req.body;

                        const infoAfterGenerateOTP = await OTP_MODEL.createOTP({ phone, type });
                        res.json(infoAfterGenerateOTP);
                    }],
				},
            },

            /**
             * Function: Verify code OTP (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.VERIFY_OTP]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async (req, res) => {
                        const { phone, code, type } = req.body;

                        const infoAfterVerify = await OTP_MODEL.verifyOTP({ phone, code, type });
                        res.json(infoAfterVerify);
                    }],
				},
            },

            /**
             * Function: Đăng ký account normal (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.REGISTER_NORMAL]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async (req, res) => {
                        const { username, fullname, email, phone, password, confirmPassword, otpID } = req.body;

                        const infoSignUp = await ACCOUNT_MODEL.registerNormal({ 
                            username, fullname, email, phone, password, confirmPassword, otpID
                        });
                        res.json(infoSignUp);
                    }],
				},
            },

             /**
             * Function: Đăng ký account social (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.REGISTER_SOCIAL]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async (req, res) => {
                        const { uid, fullname, email, phone, type, otpID } = req.body;

                        const infoSignUp = await ACCOUNT_MODEL.registerSocial({
                            uid, fullname, email, phone, type, otpID
                        });
                        res.json(infoSignUp);
                    }],
				},
            },

            /**
             * Function: Đăng nhập account normal (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.LOGIN_NORMAL]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async (req, res) => {
                        const { account, password } = req.body;

                        const infoSignIn = await ACCOUNT_MODEL.loginNormal({ account, password });
                        res.json(infoSignIn);
                    }],
				},
            },

            /**
             * Function: Đăng nhập account social (API)
             * Date: ...
             * Dev: MinhVH
             */
             [CF_ROUTINGS_ACCOUNT.LOGIN_SOCIAL]: {
                config: {
					scopes: ['public'],
					type: 'json'
				},
				methods: {
                    post: [ async (req, res) => {
                        const { uid, accessToken } = req.body;

                        const infoSignIn = await ACCOUNT_MODEL.loginSocial({ uid, accessToken });
                        res.json(infoSignIn);
                    }],
				},
            },

            /**
             * Function: Đăng nhập account với OTP (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.LOGIN_OTP]: {
                config: {
					scopes: ['public'],
					type: 'json'
				},
				methods: {
                    post: [ async (req, res) => {
                        const { phone, code } = req.body;

                        const infoSignIn = await ACCOUNT_MODEL.loginOTP({ phone, code });
                        res.json(infoSignIn);
                    }],
				},
            },

            /**
             * Function: Cập nhật mật khẩu user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATE_PASSWORD]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { password, confirmPassword } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.updatePassword({
                            userID, password, confirmPassword
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Quên mật khẩu user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.FORGOT_PASSWORD]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { account, password, confirmPassword, otpID } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.forgotPassword({
                            account, password, confirmPassword, otpID
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },


            /**
             * ========================== **************** ================================
             * ========================== QUẢN LÝ ACCOUNT  ================================
             * ========================== **************** ================================
             */

			/**
             * Function: Tạo user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.CREATE_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    post: [ async function (req, res) {
                        const { fullname, username, email, password, confirmPassword, role, status } = req.body;

                        const infoAfterInsertAccount = await ACCOUNT_MODEL.insert({
                            fullname, username, email, password, confirmPassword, role, status
                        });
                        res.json(infoAfterInsertAccount);
                    }]
                },
            },

            /**
             * Function: Cập nhật user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATE_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { fullname, username, birthday, gender, language, role, status } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.update({
                            userID, fullname, username, birthday, gender, language, role, status
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Cập nhật avatar user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATA_AVATAR]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { avatar } = req.body;

                        let avatarID = null;
                        if(avatar){
                            const infoImage = await IMAGE_MODEL.insert({
                                name: avatar.name,
                                size: avatar.size,
                                type: avatar.type,
                                path: avatar.uri,
                                userCreate: userID
                            })

                            if(!infoImage.error){
                                avatarID = infoImage.data._id;
                            }
                        }

                        const infoAfterUpdate = await ACCOUNT_MODEL.updateAvatar({
                            userID, avatarID
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Cập nhật email user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATA_EMAIL]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { email } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.updateEmail({
                            userID, email
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Cập nhật phone user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATA_PHONE]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { phone } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.updatePhone({
                            userID, phone
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Cập nhật device user (API)
             * Date: ...
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ACCOUNT.UPDATE_DEVICE]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    put: [ async function (req, res) {
                        const { _id: userID } = req.user;
                        const { deviceName, deviceType, deviceID, fcmToken } = req.body;

                        const infoAfterUpdate = await ACCOUNT_MODEL.updateDevice({
                            userID, deviceName, deviceType, deviceID, fcmToken
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

			/**
			 * Function: Xóa user (API)
			 * Date: ...
			 * Dev: MinhVH
			 */
			[CF_ROUTINGS_ACCOUNT.DELETE_USER]: {
                config: {
                    scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    delete: [ async function (req, res) {
						const { userID } = req.query;

                        const infoAfterDelete = await ACCOUNT_MODEL.delete({ userID });
                        res.json(infoAfterDelete);
                    }]
                },
            },

            /**
             * Function: Thông tin user (API)
             * Date: ...
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ACCOUNT.INFO_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
						const { userID } = req.query;

                        const infoUser = await ACCOUNT_MODEL.getInfo({ userID });
                        res.json(infoUser);
                    }]
                },
            },

            /**
             * Function: Danh sách user (API)
             * Date: ...
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ACCOUNT.LIST_USER]: {
                config: {
                    scopes: ['admin'],
					type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
						const { status, keyword } = req.query;
						const listUser = await ACCOUNT_MODEL.getList({ status, keyword });

                        const listRoles = await ROLE_BASE__COLL
                            .find({ name: { $nin: ['SUPERVISOR'] } })
                            .sort({ name: -1 })
                            .lean();

                        res.json({
							listUser: listUser.data || [],
                            listRoles,
						});
                    }]
                },
            },

        }
    }
};
