"use strict";

const path                  = require('path');
const ChildRouter           = require('../../../routing/child_routing');

const { CF_ROUTINGS_ROLE } 	= require('../constants/role_base.uri');

/**
 * COLLECTIONS, MODELS
 */
const ROLE_BASE__MODEL 		= require('../models/role_base').MODEL;
const ROLE_BASE__COLL 		= require('../databases/role_base-coll');
const ROLE_PERMISSION__COLL	= require('../databases/role_permission-coll');
const USER_COLL 			= require('../../user/databases/user-coll');
const API_MODEL		 		= require('../models/api_management').MODEL;

module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {

			/**
             * ========================== ****************** ================================
             * ========================== QUẢN LÝ ROLE-BASE  ================================
             * ========================== ****************** ================================
             */

			/**
             * Func: List role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_ROLE.LIST_ROLES]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Role Base Access Control - LDK SOFTWARE',
					code: 'MANAGE_ROLE',
					inc: path.resolve(__dirname, '../views/role/list_role.ejs')
                },
                methods: {
                    get: [ async function (req, res) {
						const listRoles = await ROLE_BASE__COLL
							.find({})
							.sort({ createAt: -1 })
							.lean();

                        ChildRouter.renderToView(req, res, { listRoles });
                    }],
                }
            },

			/**
             * Func: Add role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.ADD_ROLE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { name, description } = req.body;

						const infoAfterInsert = await ROLE_BASE__MODEL.insert({ name, description });
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Update role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.UPDATE_ROLE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { roleID, name, description } = req.body;

						const infoAfterInsert = await ROLE_BASE__MODEL.update({ roleID, name, description });
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Delete role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.DELETE_ROLE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { role } = req.query;

						await ROLE_BASE__COLL.findByIdAndDelete(role);
						res.sendStatus(204);
                    }]
                }
            },

			/**
             * Func: Detail role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.DETAIL_ROLE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Role Base Access Control - LDK SOFTWARE',
					code: 'MANAGE_ROLE',
					inc: path.resolve(__dirname, '../views/role/detail_role.ejs')
                },
                methods: {
					get: [ async function (req, res) {
						const { role } = req.params;
						const infoRole 			= await ROLE_BASE__COLL.findById(role).lean();
						const listPermissions 	= await ROLE_BASE__MODEL.getListPermissionByRole({ role });
						const listApi			= await API_MODEL.getList({});
						const listUserByRole	= await USER_COLL.find({ roles: { $in: [role] } });

                        ChildRouter.renderToView(req, res, {
							infoRole: infoRole || {},
							listPermissions: listPermissions.data || [],
							listApi: listApi.data || [],
							listUserByRole: listUserByRole || []
						});
                    }],
                }
            },

			/**
             * ========================== ************************ ================================
             * ========================== QUẢN LÝ ROLE-PERMISSION  ================================
             * ========================== ************************ ================================
             */

			/**
             * Func: Add role permission
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.ADD_ROLE_PERMISSION]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { roleID, scopes } = req.body;

						const infoAfterInsert = await ROLE_BASE__MODEL.insertPermission({ roleID, scopes });
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Delete role permission
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.DELETE_ROLE_PERMISSION]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { permissionID } = req.query;

						await ROLE_PERMISSION__COLL.findByIdAndDelete(permissionID);
						res.sendStatus(204);
                    }]
                }
            },

			/**
             * Func: Search user for add role
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.SEARCH_USER]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { keyword } = req.query;

						const conditionObj = {};
						if(keyword){
							let key = keyword.split(" ");
							key = '.*' + key.join(".*") + '.*';
		
							conditionObj.$or = [
								{ username: new RegExp(key, 'i') },
								{ email: new RegExp(key, 'i') },
							]
						}

						const listUsers = await USER_COLL.find(conditionObj).lean();
						res.json(listUsers);
                    }]
                }
            },

			/**
             * Func: Add role for user
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.ADD_ROLE_TO_USER]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { usersID, roleID } = req.body;

						const infoAfterUpdate = await USER_COLL.updateMany({
							_id: { $in: usersID }
						}, {
							$addToSet: {
								roles: roleID
							}
						})
						res.json(infoAfterUpdate);
                    }]
                }
            },

			/**
             * Func: Delete role for user
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.DELETE_ROLE_FOR_USER]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { userID, roleID } = req.body;

						const infoAfterUpdate = await USER_COLL.findByIdAndUpdate(userID, {
							$pull: {
								roles: roleID
							}
						})
						res.json(infoAfterUpdate);
                    }]
                }
            },


			/**
             * ========================== ************************ ================================
             * ========================== QUẢN LÝ USER-PERMISSION  ================================
             * ========================== ************************ ================================
             */

			/**
             * Func: List user
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			 [CF_ROUTINGS_ROLE.LIST_USERS]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Role Base Access Control - LDK SOFTWARE',
					code: 'MANAGE_USER',
					inc: path.resolve(__dirname, '../views/user/list_user.ejs')
                },
                methods: {
                    get: [ async function (req, res) {
						const listUsers = await USER_COLL
							.find({})
							.sort({ createAt: -1 })
							.lean();

						const listApi 	= await API_MODEL.getList({});
						const listRoles = await ROLE_BASE__MODEL.getList({});

                        ChildRouter.renderToView(req, res, { 
							listUsers,
							listApi: listApi.data || [],
							listRoles: listRoles.data || []
						});
                    }],
                }
            },

			/**
             * Func: Add role for user
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			 [CF_ROUTINGS_ROLE.ADD_PERMISSION_DIRECTLY]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { userID, scopesID } = req.body;

						const infoAfterUpdate = await USER_COLL.findByIdAndUpdate(userID, {
							$addToSet: {
								permissions: scopesID
							}
						})
						res.json(infoAfterUpdate);
                    }]
                }
            },
			
			/**
             * Func: Delete user
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_ROLE.DELETE_USER]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { userID } = req.query;

						const infoAfterDelete = await USER_COLL.findByIdAndDelete(userID)
						res.json(infoAfterDelete);
                    }]
                }
            },

        }
    }
};
