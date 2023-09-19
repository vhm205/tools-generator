"use strict";

/**
 * EXTERNAL PACKAGE
 */
const path 									= require('path');

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                           = require('../../../routing/child_routing');
const { CF_ROUTINGS_USER } 					= require('../constants/user.uri');

/**
 * MODELS
 */
const USER_MODEL 							= require('../models/user').MODEL;

/**
 * COLLECTIONS
 */
// const REGION_COLL                             = require('../../region_area/databases/region-coll');
const ROLE_BASE__COLL                       = require('../../auth/databases/role_base-coll');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ******************* ================================
             * ========================== QUẢN LÝ USER ADMIN  ================================
             * ========================== ******************* ================================
             */

            /**
             * Function: Danh sách user (permission: admin) (API, VIEW)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_USER.LIST_USER]: {
                config: {
                    scopes: ['admin'],
					type: 'view',
					title: 'Quản lý Admin',
					code: '/admin/list-admin',
					inc: path.resolve(__dirname, '../views/list_user.ejs'),
                    view: 'index.ejs'
                },
                methods: {
                    get: [ async function (req, res) {
						const { status, keyword } = req.query;
						const listUser = await USER_MODEL.getList({ status, keyword });

                        const listRoles = await ROLE_BASE__COLL
                            .find({ name: { $nin: ['SUPERVISOR'] } })
                            .sort({ name: -1 })
                            .lean();

                        ChildRouter.renderToView(req, res, {
							listUser: listUser.data || [],
                            listRoles,
						});
                    }]
                },
            },

			/**
             * Function: Tạo user (permission: admin) (API)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_USER.ADD_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    post: [ async function (req, res) {
                        const { fullname, username, email, password, confirmPassword, role, status } = req.body;

                        const infoAfterInsertAccount = await USER_MODEL.insert({
                            fullname, username, email, password, confirmPassword, role, status
                        });
                        res.json(infoAfterInsertAccount);
                    }]
                },
            },

            /**
             * Function: Cập nhật user (permission: admin) (API)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_USER.UPDATE_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    post: [ async function (req, res) {
                        const { userID, fullname, username, password, role, status } = req.body;

                        const infoAfterUpdate = await USER_MODEL.update({
                            userID, fullname, username, password, role, status
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

			/**
			 * Function: Xóa user (permission: admin) (API)
			 * Date: 14/06/2021
			 * Dev: MinhVH
			 */
			[CF_ROUTINGS_USER.DELETE_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    delete: [ async function (req, res) {
						const { userID } = req.query;

                        const infoAfterDelete = await USER_MODEL.delete({ userID });
                        res.json(infoAfterDelete);
                    }]
                },
            },

            /**
             * Function: Thông tin user (permission: admin) (API)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_USER.INFO_USER]: {
                config: {
                    scopes: ['admin'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
						const { userID } = req.query;

                        const infoUser = await USER_MODEL.getInfo({ userID });
                        res.json(infoUser);
                    }]
                },
            },

        }
    }
};
