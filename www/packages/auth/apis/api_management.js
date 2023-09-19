"use strict";

const path                  = require('path');
const ChildRouter           = require('../../../routing/child_routing');

const { CF_ROUTINGS_API } 	= require('../constants/api_management.uri');

/**
 * COLLECTIONS, MODELS
 */
const API_MODEL				= require('../models/api_management').MODEL;
const API_IDENTIFIER_COLL	= require('../databases/api_identifier-coll');
const API_SCOPE_COLL		= require('../databases/api_scope-coll');

module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {

			/**
             * ========================== *********************** ================================
             * ========================== QUẢN LÝ API-IDENTIFIER  ================================
             * ========================== *********************** ================================
             */

			/**
             * Func: List api
             * Date: 24/09/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_API.LIST_API]: {
                config: {
					scopes: [ 'supervisor' ],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Role Base Access Control - LDK SOFTWARE',
					code: 'MANAGE_API',
					inc: path.resolve(__dirname, '../views/api/list_api.ejs')
                },
                methods: {
                    get: [ async function (req, res) {
						const listApis = await API_IDENTIFIER_COLL
							.find({})
							.sort({ createAt: -1 })
							.lean();

                        ChildRouter.renderToView(req, res, { listApis });
                    }],
                }
            },

			/**
             * Func: Add api
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.ADD_API]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { name, endpoint } = req.body;

						const infoAfterInsert = await API_MODEL.insert({ name, endpoint });
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Update api
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.UPDATE_API]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { apiID, name, status } = req.body;

						const infoAfterInsert = await API_MODEL.update({
							apiID, name, status
						});
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Delete api
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.DELETE_API]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { api } = req.query;

						const infoAfterDelete = await API_MODEL.deleteApi({ apiID: api });
						res.json(infoAfterDelete);
                    }]
                }
            },

			/**
             * Func: Detail api
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.DETAIL_API]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Role Base Access Control - LDK SOFTWARE',
					code: 'MANAGE_API',
					inc: path.resolve(__dirname, '../views/api/detail_api.ejs')
                },
                methods: {
					get: [ async function (req, res) {
						const { api } = req.params;

						const infoApi 		= await API_IDENTIFIER_COLL.findById(api).lean();
						const listApiScope 	= await API_SCOPE_COLL.find({ api }).lean();

                        ChildRouter.renderToView(req, res, { 
							infoApi: infoApi || {},
							listApiScope: listApiScope || []
						});
                    }],
                }
            },


			/**
             * ========================== ****************** ================================
             * ========================== QUẢN LÝ API-SCOPE  ================================
             * ========================== ****************** ================================
             */

			/**
             * Func: Add scope
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			 [CF_ROUTINGS_API.ADD_SCOPE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					post: [ async function (req, res) {
						const { name, description, apiID } = req.body;

						const infoAfterInsert = await API_MODEL.insertScope({ name, description, apiID });
						res.json(infoAfterInsert)
                    }]
                }
            },

			/**
             * Func: Delete scope
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.DELETE_SCOPE]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { scopeID } = req.query;

						await API_MODEL.deleteScope({ scopeID });
						res.sendStatus(204);
                    }]
                }
            },

			/**
             * Func: List scope
             * Date: 24/09/2021
             * Dev: MinhVH
             */
			[CF_ROUTINGS_API.LIST_SCOPE_BY_API]: {
                config: {
                    scopes: [ 'supervisor' ],
                    type: 'json',
                },
                methods: {
					get: [ async function (req, res) {
						const { api } = req.query;

						const listScopeByAPi = await API_MODEL.getListScopeByApi({ api });
						res.json(listScopeByAPi);
                    }]
                }
            },

        }
    }
};
