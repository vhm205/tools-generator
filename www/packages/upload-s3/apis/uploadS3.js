"use strict";

/**
 * EXTERNAL PACKAGE
 */
const uuidv4        = require('uuid').v4;

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                          = require('../../../routing/child_routing');
const { CF_ROUTINGS_UPLOAD_S3 }            = require('../constants');
const { GENERATE_LINK_S3 }                 = require('../utils');
const { getExtension } 					   = require('../../../utils/utils');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ********** ================================
             * ========================== QUẢN LÝ S3 ================================
             * ========================== ********** ================================
             */

            [CF_ROUTINGS_UPLOAD_S3.GENERATE_LINK_S3]: {
                config: {
                    scopes: [ 'public' ],
                    type: 'json'
                },
                methods: {
                    get: [ async function (req, res) {
                        let { type, name } = req.query;
						let extension = getExtension(name);
                        let fileName = `${uuidv4()}.${extension}`;

                        let linkUpload = await GENERATE_LINK_S3(fileName, type);

                        if(linkUpload.error)
                            return res.json({error: true, message: "cannot_create_link"});

                        return res.json({ error: false, linkUpload, fileName });
                    }]
                }
            },

        }
    }
};
