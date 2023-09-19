"use strict";

const jwt 					= require('jsonwebtoken');
const cfJwt 				= require('./cf_jws');
const { networkInterfaces } = require('os');

const {
	ADMIN_ACCESS,
	TYPE_RESPONSE
} = require('../utils/constant');

const { 
	checkAndResponseForEachEnv, 
	getParams, 
	getData
} = require('./helpers');
const BEHAVIOR_MODEL = require("../packages/user/models/behavior").MODEL;

const ROLE_PERMISSION__COLL = require('../packages/auth/databases/role_permission-coll');
const API_SCOPE__COLL 		= require('../packages/auth/databases/api_scope-coll');
const ROLE_BASE__COLL 		= require('../packages/auth/databases/role_base-coll');

/**
 * LẤY IP ADDRESS
 */
const nets = networkInterfaces();
const IPAddress = {}; // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!IPAddress[name]) {
                IPAddress[name] = [];
            }
            IPAddress[name].push(net.address);
        }
    }
}

module.exports = {
    role: {
        all: {
            bin: 1,
            auth: (_, __, next) => next()
        },
        admin: {
            bin: 2,
            auth: (req, res, next) => {
				let { envAccess, token } = getParams(req);

				if(!token){
					return checkAndResponseForEachEnv({
						res,
						envAccess,
						typeResponse: TYPE_RESPONSE.NOT_PROVIDE_TOKEN
					})
				}

				jwt.verify(token, cfJwt.secret, async (error, decoded) => {
					if (error) {
						return checkAndResponseForEachEnv({
							res,
							envAccess,
							typeResponse: TYPE_RESPONSE.TOKEN_INVALID
						});
					}

					if (!ADMIN_ACCESS.includes(+decoded.role)) {
						return checkAndResponseForEachEnv({
							res,
							envAccess,
							typeResponse: TYPE_RESPONSE.PERMISSION_DENIED
						});
					}

					let obj = getData(req);
					let objData = {
						...obj,
						user: decoded._id,
						role: decoded.role,
						IPAddress,
						envAccess,
					}
					await BEHAVIOR_MODEL.insert({...objData});

					req.user 		= decoded;
					req.envAccess   = envAccess;
					next();
				});
            }
        },
    },

    authorizationV1: function (req, res, next) {
        let hasRole = false;
        let currentRole = null;

        for (let itemRole in this.role) {
            if (!hasRole) {
                if (res.bindingRole.config.auth.includes(this.role[ itemRole ].bin)) {
                    hasRole = true;
                    currentRole = this.role[ itemRole ];
                }
            }
        }

        currentRole.auth(req, res, next);
    },

	authorization: function(req, res, next) {
		let { envAccess, token } = getParams(req);
		let { scopes } = res.bindingRole.config;

		console.log({
			host: req.get('host'),
			originalUrl: req.originalUrl,
			// config: res.bindingRole.config,
			token, scopes
		})

		if(!scopes || !scopes.length){
			return checkAndResponseForEachEnv({
				res,
				envAccess
			})
		}

		if(scopes.includes('public')) return next();

		if(!token){
			return checkAndResponseForEachEnv({
				res,
				envAccess,
				typeResponse: TYPE_RESPONSE.NOT_PROVIDE_TOKEN
			})
		}

		jwt.verify(token, cfJwt.secret, async (error, decoded) => {
			if (error) {
				return checkAndResponseForEachEnv({
					res,
					envAccess,
					typeResponse: TYPE_RESPONSE.TOKEN_INVALID
				});
			}

			let hasPermission = false;

			if(decoded.permissions && decoded.permissions.length){
				const listPermissions = await API_SCOPE__COLL
					.find({ _id: { $in: decoded.permissions } })
					.lean();

				for (const permission of listPermissions) {
					if(scopes.includes(permission.name)){
						hasPermission = true;
						break;
					}
				}
			}

			if(decoded.roles && decoded.roles.length && !hasPermission){
				let listRoles = await ROLE_BASE__COLL.find({ _id: { $in: decoded.roles } }).lean();
				listRoles = listRoles.map(role => role.name);

				if(listRoles.includes('ROOT') || listRoles.includes('ADMIN')){
					if(scopes.includes('admin')){
						hasPermission = true;
					}
				}

				if(!listRoles.includes('SUPERVISOR')){
					const listPermissions = await ROLE_PERMISSION__COLL
						.find({ role: { $in: decoded.roles } })
						.populate('scope')
						.lean();

					for (const permission of listPermissions) {
						const { name } = permission.scope;

						if(scopes.includes(name)){
							hasPermission = true;
							break;
						}
					}
				} else{
					req.role = 'SUPERVISOR';
					hasPermission = true;
				}
			}

			if((!decoded.roles && !decoded.permissions) || !hasPermission){
				return checkAndResponseForEachEnv({
					res,
					envAccess,
					typeResponse: TYPE_RESPONSE.PERMISSION_DENIED
				});
			}

			let obj = getData(req);
			req.objData = {
				...obj,
				IPAddress,
				envAccess,
				user: decoded._id,
				roles: decoded.roles,
				permissions: decoded.permissions
			}

			req.user 		= decoded;
			req.envAccess   = envAccess;

			next();
		});

	}
};
