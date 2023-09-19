"use strict";

/**
 * EXTERNAL PACKAGES
 */
const ObjectID                      = require('mongoose').Types.ObjectId;

/**
 * INTERNAL PACKAGES
 */

/**
 * BASES
 */
const BaseModel 					= require('../../../models/intalize/base_model');

/**
 * COLLECTIONS
 */
const BEHAVIOR_COLL  					= require('../databases/behavior-coll');
const { checkObjectIDs }            = require("../../../utils/utils");

class Model extends BaseModel {
    constructor() {
        super(BEHAVIOR_COLL);
    }

	insert({ user, action, url, description, IPAddress, envAccess, role }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(user))
                    return resolve({ error: true, message: 'id_invalid' });

                const BROWSE = 1;
                const MOBILE = 2;
                const SORT_ENVACCESS = [BROWSE, MOBILE];

                const ADMIN    = 0;
                const OWNER    = 1;
                const EDITER   = 2;
                // const CUSTOMER = 3;
                const SORT_ROLE = [ADMIN, OWNER, EDITER];
                if(!action || !url || !IPAddress || (Number.isNaN(Number(envAccess)) && !SORT_ENVACCESS.includes(Number(envAccess))) || (Number.isNaN(Number(role)) && !SORT_ROLE.includes(Number(role)))) {
                    return resolve({ error: true, message: 'action_url_IPAddress_envAccess_role_invalid' });
                }

                let dataInsert = {
                    user,
                    action,
                    url,
                    description,
                    IPAddress,
                    envAccess,
                    role,
                }
                if (description && description.body) { 
                    dataInsert = {
                        ...dataInsert,
                        description
                    }
                }
                // console.log({ dataInsert });
                let infoAfterInsert = await this.insertData(dataInsert);

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'create_behavior_failed' });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;
