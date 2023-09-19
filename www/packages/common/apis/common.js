"use strict";

/**
 * EXTERNAL PACKAGE
 */
const fs                                        = require('fs');
const path                                      = require('path');

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                               = require('../../../routing/child_routing');
const USER_SESSION							    = require('../../../session/user-session');
const { CF_ROUTINGS_COMMON }                    = require('../constants/common.uri');
const { districts }                             = require('../constants/districts');
const { provinces }                             = require('../constants/provinces');
const { JOB_TYPES }                             = require('../constants');

/**
 * MODELS
 */
const USER_MODEL 	                            = require('../../user/models/user').MODEL;
const COMMON_MODEL 	                            = require('../models/common').MODEL;


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ************** ================================
             * ========================== QUẢN LÝ CHUNG  ================================
             * ========================== ************** ================================
             */

            /**
             * Function: Upload file self-host (API)
             * Date: 21/12/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.UPLOAD_FILE]: {
                config: {
                    scopes: ['public'],
                    type: 'json',
                },
                methods: {
                    post: [ async (req, res) => {
                        req.pipe(req.busboy); // Pipe it trough busboy

                        const uploadPath = path.join(__dirname, '../../../../files/uploads');
                        const uploadPathCompressed = `${uploadPath}/uncompressed`;

                        if(!fs.existsSync(uploadPath)){
                            fs.mkdirSync(uploadPath);
                            fs.mkdirSync(uploadPathCompressed);
                        } 

                        if(!fs.existsSync(uploadPathCompressed)){
                            fs.mkdirSync(uploadPathCompressed);
                        }

                        req.busboy.on('file', (fieldname, file, filename) => {
                            console.log(`Upload of '${filename}' started, ${fieldname}`);

                            // Create a write stream of the new file
                            const fstream = fs.createWriteStream(`${uploadPathCompressed}/${filename}`);
                            file.pipe(fstream);

                            // On finish of the upload
                            fstream.on('close', () => {
                                console.log(`Upload of '${filename}' finished`);
                                res.json({ error: false, message: 'upload_success' });
                            });
                        });
                    }]
                },
            },

            /**
             * Function: Push queue (API)
             * Date: 21/12/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.PUSH_JOB_TO_QUEUE]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
                methods: {
                    post: [ async (req, res) => {
                        let { jobType } = req.body;
                        let infoAfterPush = null;

                        switch (jobType) {
                            case JOB_TYPES.COMPRESS_IMAGE:
                                let { imageID } = req.body;
                                infoAfterPush = await COMMON_MODEL.pushJobCompressImage({ imageID });
                                break;
                            default:
                                break;
                        }

                        res.json(infoAfterPush);
                    }]
                }
            },

            [CF_ROUTINGS_COMMON.SOMETHING_WRONG]: {
                config: {
					scopes: ['public'],
					type: 'view',
                    inc : 'pages/something-wrong.ejs',
                    view: 'pages/something-wrong.ejs'
				},
                methods: {
                    get: [ (req, res) => {
                        ChildRouter.renderToView(req, res);
                    }]
                }
            },

            /**
             * Function: Đăng nhập account (VIEW, API)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.LOGIN]: {
                config: {
					scopes: ['public'],
					type: 'view',
                    inc : 'pages/login-admin.ejs',
                    view: 'pages/login-admin.ejs'
				},
				methods: {
					get: [ (req, res) => {
						 /**
                         * CHECK AND REDIRECT WHEN LOGIN
                         */
						const infoLogin = USER_SESSION.getUser(req.session);
						if (infoLogin && infoLogin.user && infoLogin.token)
							return res.redirect('/');

						ChildRouter.renderToView(req, res);
					}],
                    post: [ async (req, res) => {
                        const { account, password } = req.body;

                        const infoSignIn = await USER_MODEL.signIn({ account, password });
						if (!infoSignIn.error) {
							const { user, token } = infoSignIn.data;

                            USER_SESSION.saveUser(req.session, {
                                user, 
                                token,
                            });
                        }

                        res.json(infoSignIn);
                    }],
				},
            },

            /**
             * Function: Clear session and redirect to login page (API)
             * Date: 14/06/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.LOGOUT]: {
                config: {
					scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        USER_SESSION.destroySession(req.session);
						res.redirect('/login');
                    }]
                },
            },

            /**
             * Function: Danh sách tỉnh thành (API)
             * Date: 20/10/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.LIST_PROVINCES]: {
                config: {
                    scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        let listProvince = Object.entries(provinces);
                        res.json({ data: listProvince });
                    }]
                },
            },

            /**
             * Function: Danh sách quận huyện (API)
             * Date: 20/10/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.LIST_DISTRICTS]: {
                config: {
                    scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        let { province } = req.params;
                        let listDistricts = [];

                        let filterObject = (obj, filter, filterValue) => 
                            Object.keys(obj).reduce((acc, val) =>
                            (obj[val][filter] === filterValue ? {
                                ...acc,
                                [val]: obj[val]  
                            } : acc
                        ), {});

                        if (province && !Number.isNaN(Number(province))) {
                            listDistricts = filterObject(districts, 'parent_code', province.toString())
                        }
                        res.json({ province, data: listDistricts });
                    }]
                },
            },

             /**
             * Function: Danh sách thành phố (API)
             * Date: 20/10/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_COMMON.LIST_WARDS]: {
                config: {
                    scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        let { district } = req.params;
                        let listWards = [];
                        let filePath  = path.resolve(__dirname, `../constants/wards/${district}.json`);

                        fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data){
                            if (!err) {
                                listWards = JSON.parse(data);
                                res.json({ district, data: listWards });
                            } else {
                                res.json({ error: true, message: "Quận/huyện không tồn tại" });
                            }
                        });
                    }]
                },
            },

        }
    }
};
