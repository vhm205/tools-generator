
const express 			= require('express');
const moment 			= require('moment');
const lodash			= require('lodash');
const url 				= require('url');
const formatCurrency 	= require('number-format.js');

/**
 *	INTERNAL PACKAGE
 */
require('../../app');
const { CF_ROUTINGS_COMMON } 	 				= require('../packages/common/constants/common.uri');
const { CF_ROUTINGS_ROLE } 	 					= require('../packages/auth/constants/role_base.uri');
const { CF_ROUTINGS_API } 	 					= require('../packages/auth/constants/api_management.uri');
const { CF_ROUTINGS_USER } 	 					= require('../packages/user/constants/user.uri');

const ROLE_PERMISSION__COLL                     = require('../packages/auth/databases/role_permission-coll');
// const logger		                            = require('../config/logger/winston.config');

class ChildRouter{
    constructor(basePath) {
        this.basePath = basePath;
        this.registerRouting;
    }

    registerRouting() {
    }

    exportModule() {
        let router = express.Router();

        for (let basePath in this.registerRouting()) {
            const item = this.registerRouting()[basePath];

            if (typeof item.methods.post !== 'undefined' && item.methods.post !== null) {
                if (item.methods.post.length === 1) {
                    router.post(basePath, item.methods.post[0]);
                } else if (item.methods.post.length === 2) {
                    router.post(basePath, item.methods.post[0], item.methods.post[1]);
                }
            }

            if (typeof item.methods.get !== 'undefined' && item.methods.get !== null) {
                if (item.methods.get.length === 1) {
                    router.get(basePath, item.methods.get[0]);
                } else if (item.methods.get.length === 2) {
                    router.get(basePath, item.methods.get[0], item.methods.get[1]);
                }
            }

            if (typeof item.methods.put !== 'undefined' && item.methods.put !== null) {
                if (item.methods.put.length === 1) {
                    router.put(basePath, item.methods.put[0]);
                } else if (item.methods.put.length === 2) {
                    router.put(basePath, item.methods.put[0], item.methods.put[1]);
                }
            }

            if (typeof item.methods.delete !== 'undefined' && item.methods.delete !== null) {
                if (item.methods.delete.length === 1) {
                    router.delete(basePath, item.methods.delete[0]);
                } else if (item.methods.delete.length === 2) {
                    router.delete(basePath, item.methods.delete[0], item.methods.delete[1]);
                }
            }

        }
        return router;
    }

    /**
     *
     * @param {*} msg
     * @param {*} res
     * @param {*} data
     * @param {*} code
     * @param {*} status  tham số nhận biết lỗi
     */
    static responseError(msg, res, data, code, status) {
        if (code) {
            res.status(code);
        }
        return res.json({error: true, message: msg, data: data, status: status});
    }

    static response(response, data) {
        return response.json(data);
    }

    static responseSuccess(msg, res, data, code) {
        if (code) {
            res.status(code);
        }

        return res.json({error: false, message: msg, data: data});
    }

    static pageNotFoundJson(res) {
        res.status(404);
        return res.json({"Error": "Page not found!"});
    }

    /**
     *
     * @param {*} req
     * @param {*} res
     * @param {*} data
     * @param {*} title
     */
    static async renderToView(req, res, data, title) {
        data = typeof data === 'undefined' || data === null ? {} : data;

        if (title) {
            res.bindingRole.config.title = title;
        }

        data.render = res.bindingRole.config;
        data.url = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl
        });

        //_________Thư viện thời gian
		data.moment = moment;

		//_________Thư viện tiện ích
		data.lodash = lodash;

		//_________Thư viện số
        data.formatCurrency = formatCurrency;

		if(req.user){
			data.infoUser = req.user;
            data.ROLE_USER = req.role;

            let scopes = [];
            let listPermissions = await ROLE_PERMISSION__COLL
                .find({ role: { $in: req.user.roles } })
                .populate('scope')
                .lean();

            for (const permission of listPermissions) {
                const { name } = permission.scope;
                scopes[scopes.length] = name;
            }

            data.scopes = scopes;
		} else{
            data.infoUser   = {};
            data.scopes     = [];
            data.ROLE_USER  = null;
        }

        data.CF_ROUTINGS_COMMON   	 = CF_ROUTINGS_COMMON;
		data.CF_ROUTINGS_USER	  	 = CF_ROUTINGS_USER;

		data.CF_ROUTINGS_ROLE		 = CF_ROUTINGS_ROLE;
		data.CF_ROUTINGS_API		 = CF_ROUTINGS_API;

		// logger.error("This is an error log");
		// logger.warn("This is a warn log");
		// logger.info("This is a info log");
		// logger.debug("This is a debug log");
		// logger.http("This is a http log");

        return res.render(res.bindingRole.config.view, data);
    }

    static renderToPath(req, res, path, data) {
        data = data == null ? {} : data;
        data.render = res.bindingRole.config;
        return res.render(path, data);
    }

    static renderToViewWithOption(req, res, pathRender, data) {
        return res.render(pathRender, {data});
    }

    static redirect(res, path) {
        return res.redirect(path);
    }
}

module.exports = ChildRouter;
