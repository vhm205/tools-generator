"use strict";

/**
 * EXTERNAL PACKAGE
 */
const path = require('path');
const beautifyer = require('js-beautify').js_beautify;
const fs = require('fs');
const moment = require('moment');
const logger = require('../../../config/logger/winston.config');
const chalk = require('chalk');
const log = console.log;

/**
 * INTERNAL PACKAGE
 */
const ChildRouter = require('../../../routing/child_routing');
const {} = require('../constants/testing');
const {
    CF_ROUTINGS_TESTING
} = require('../constants/testing/testing.uri');
const {
    uploadSingle
} = require('../../../config/cf_helpers_multer');

/**
 * MODELS
 */
const TESTING_MODEL = require('../models/testing').MODEL;
const IMAGE_MODEL = require('../../image/models/image').MODEL;
const MANAGE_COLL_MODEL = require('../../../models/manage_coll').MODEL;

/**
 * COLLECTIONS
 */


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * =============================== ************* ===============================
             * =============================== QUẢN LÝ TESTING  ===============================
             * =============================== ************* ===============================
             */




            /**
             * Function: Insert Testing (API, VIEW)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.ADD_TESTING]: {
                config: {
                    scopes: ['create:testing'],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Thêm Testing',
                    code: CF_ROUTINGS_TESTING.ADD_TESTING,
                    inc: path.resolve(__dirname, '../views/testing/add_testing.ejs')
                },
                methods: {
                    get: [async function(req, res) {


                        ChildRouter.renderToView(req, res, {

                            CF_ROUTINGS_TESTING
                        });
                    }],
                    post: [async function(req, res) {
                        let userCreate = req.user && req.user._id;
                        let {
                            images,
                            avatar,
                            images2,
                            price,
                        } = req.body;


                        if (images && images.length) {
                            let listFiles = images.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images = listFiles.map(file => file.data._id);
                        }

                        if (avatar) {
                            let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                name: avatar.name,
                                path: avatar.path,
                                type: avatar.type,
                                size: avatar.size
                            });
                            avatar = infoImageAfterInsert.data._id;
                        }

                        if (images2 && images2.length) {
                            let listFiles = images2.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images2 = listFiles.map(file => file.data._id);
                        }

                        let infoAfterInsert = await TESTING_MODEL.insert({
                            images,
                            avatar,
                            images2,
                            price,
                            userCreate
                        });
                        res.json(infoAfterInsert);
                    }]
                },
            },

            /**
             * Function: Update Testing By Id (API, VIEW)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.UPDATE_TESTING_BY_ID]: {
                config: {
                    scopes: ['update:testing'],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Cập nhật Testing',
                    code: CF_ROUTINGS_TESTING.UPDATE_TESTING_BY_ID,
                    inc: path.resolve(__dirname, '../views/testing/update_testing.ejs')
                },
                methods: {
                    get: [async function(req, res) {
                        let {
                            testingID
                        } = req.query;

                        let infoTesting = await TESTING_MODEL.getInfoById(testingID);
                        if (infoTesting.error) {
                            return res.redirect('/something-went-wrong');
                        }



                        ChildRouter.renderToView(req, res, {
                            infoTesting: infoTesting.data || {},


                            CF_ROUTINGS_TESTING
                        });
                    }],
                    put: [async function(req, res) {
                        let userUpdate = req.user && req.user._id;
                        let {
                            testingID,
                            images,
                            avatar,
                            images2,
                            price,
                        } = req.body;


                        if (images && images.length) {
                            let listFiles = images.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images = listFiles.map(file => file.data._id);
                        }

                        if (avatar) {
                            let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                name: avatar.name,
                                path: avatar.path,
                                type: avatar.type,
                                size: avatar.size
                            });
                            avatar = infoImageAfterInsert.data._id;
                        }

                        if (images2 && images2.length) {
                            let listFiles = images2.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images2 = listFiles.map(file => file.data._id);
                        }

                        const infoAfterUpdate = await TESTING_MODEL.update({
                            testingID,
                            images,
                            avatar,
                            images2,
                            price,
                            userUpdate
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Update not require Testing By Id (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.UPDATE_TESTING_NOT_REQUIRE_BY_ID]: {
                config: {
                    scopes: ['update:testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        let userUpdate = req.user && req.user._id;
                        let {
                            testingID,
                            images,
                            avatar,
                            images2,
                            price,
                        } = req.body;


                        if (images && images.length) {
                            let listFiles = images.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images = listFiles.map(file => file.data._id);
                        }

                        if (avatar) {
                            let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                name: avatar.name,
                                path: avatar.path,
                                size: avatar.size
                            });
                            avatar = infoImageAfterInsert.data._id;
                        }

                        if (images2 && images2.length) {
                            let listFiles = images2.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            images2 = listFiles.map(file => file.data._id);
                        }

                        const infoAfterUpdate = await TESTING_MODEL.updateNotRequire({
                            testingID,
                            images,
                            avatar,
                            images2,
                            price,
                            userUpdate
                        });
                        res.json(infoAfterUpdate);
                    }]
                },
            },

            /**
             * Function: Delete Testing By Id (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.DELETE_TESTING_BY_ID]: {
                config: {
                    scopes: ['delete:testing'],
                    type: 'json',
                },
                methods: {
                    delete: [async function(req, res) {
                        const {
                            testingID
                        } = req.params;

                        const infoAfterDelete = await TESTING_MODEL.deleteById(testingID);
                        res.json(infoAfterDelete);
                    }]
                },
            },

            /**
             * Function: Delete Testing By List Id (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.DELETE_TESTING_BY_LIST_ID]: {
                config: {
                    scopes: ['delete:testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        const {
                            testingID
                        } = req.body;

                        const infoAfterDelete = await TESTING_MODEL.deleteByListId(testingID);
                        res.json(infoAfterDelete);
                    }]
                },
            },

            /**
             * Function: Get Info Testing By Id (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_INFO_TESTING_BY_ID]: {
                config: {
                    scopes: ['read:info_testing'],
                    type: 'json',
                },
                methods: {
                    get: [async function(req, res) {
                        const {
                            testingID
                        } = req.params;

                        const infoTestingById = await TESTING_MODEL.getInfoById(testingID);
                        res.json(infoTestingById);
                    }]
                },
            },

            /**
             * Function: Get List Testing (API, VIEW)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_LIST_TESTING]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Danh sách Testing',
                    code: CF_ROUTINGS_TESTING.GET_LIST_TESTING,
                    inc: path.resolve(__dirname, '../views/testing/list_testings.ejs')
                },
                methods: {
                    get: [async function(req, res) {
                        let {
                            priceFromNumber,
                            priceToNumber,
                            typeGetList
                        } = req.query;

                        let listTestings = [];
                        if (typeGetList === 'FILTER') {
                            listTestings = await TESTING_MODEL.getListByFilter({
                                priceFromNumber,
                                priceToNumber,
                            });
                        } else {
                            listTestings = await TESTING_MODEL.getList();
                        }

                        ChildRouter.renderToView(req, res, {
                            listTestings: listTestings.data || [],

                        });
                    }]
                },
            },

            /**
             * Function: Get List Testing By Field (API, VIEW)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_LIST_TESTING_BY_FIELD]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Danh sách Testing by field isStatus',
                    code: CF_ROUTINGS_TESTING.GET_LIST_TESTING_BY_FIELD,
                    inc: path.resolve(__dirname, '../views/testing/list_testings.ejs')
                },
                methods: {
                    get: [async function(req, res) {
                        let {
                            field,
                            value
                        } = req.params;
                        let {
                            priceFromNumber,
                            priceToNumber,
                            type
                        } = req.query;

                        let listTestings = await TESTING_MODEL.getListByFilter({
                            priceFromNumber,
                            priceToNumber,
                            [field]: value,
                        });

                        ChildRouter.renderToView(req, res, {
                            listTestings: listTestings.data || [],

                            [field]: value,
                        });
                    }]
                },
            },

            /**
             * Function: Get List Testing Server Side (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_LIST_TESTING_SERVER_SIDE]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        const {
                            keyword,
                            filter,
                            condition,
                            objFilterStatic,
                            start,
                            length,
                            order
                        } = req.body;
                        const page = Number(start) / Number(length) + 1;

                        let field, dir;
                        if (order && order.length) {
                            field = req.body.columns[order[0].column].data;
                            dir = order[0].dir;
                        }

                        const listTestingServerSide = await TESTING_MODEL.getListByFilterServerSide({
                            keyword,
                            filter,
                            condition,
                            objFilterStatic,
                            page,
                            limit: length,
                            field,
                            dir
                        });
                        res.json(listTestingServerSide);
                    }]
                },
            },

            /**
             * Function: Get List Testing Import (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_LIST_TESTING_IMPORT]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        const {
                            keyword,
                            filter,
                            condition,
                            objFilterStatic,
                            start,
                            length
                        } = req.body;
                        const page = Number(start) / Number(length) + 1;

                        const listTestingImport = await TESTING_MODEL.getListByFilterImport({
                            keyword,
                            filter,
                            condition,
                            objFilterStatic,
                            page,
                            limit: length
                        });
                        res.json(listTestingImport);
                    }]
                },
            },

            /**
             * Function: Get List Testing Excel Server Side (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.GET_LIST_TESTING_EXCEL]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        let {
                            listItemExport,
                            chooseCSV,
                            nameOfParentColl,
                        } = req.body;

                        let conditionObj = TESTING_MODEL.getConditionArrayFilterExcel(listItemExport)

                        let historyExportColl = await MANAGE_COLL_MODEL.insertHistoryExport({
                            coll: conditionObj.refParent,
                            list_type_coll: conditionObj.arrayFieldIDChoice,
                            listItemExport,
                            chooseCSV,
                            nameOfParentColl
                        })

                        res.json(historyExportColl)
                    }]
                },
            },

            /**
             * Function: Download Testing Excel Export (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.DOWNLOAD_LIST_TESTING_EXCEL_EXPORT]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        let {
                            filter,
                            condition,
                            objFilterStatic,
                            order,
                            keyword,
                            arrayItemChecked
                        } = req.body;

                        let field, dir;
                        if (order && order.length) {
                            field = req.body.columns[order[0].column].data;
                            dir = order[0].dir;
                        }

                        let {
                            listCollChoice: {
                                listItemExport,
                                chooseCSV,
                                nameOfParentColl
                            }
                        } = await MANAGE_COLL_MODEL.getInfo({
                            name: 'limit_kpi_config'
                        });

                        let conditionObj = TESTING_MODEL.getConditionArrayFilterExcel(listItemExport, filter, condition, objFilterStatic, field, dir, keyword, arrayItemChecked)
                        let listTesting = await TESTING_MODEL.getListByFilterExcel({
                            arrayFilter: conditionObj.arrayFilter,
                            arrayItemCustomerChoice: conditionObj.arrayItemCustomerChoice,
                            chooseCSV,
                            nameOfParentColl
                        });

                        res.json(listTesting)
                    }]
                },
            },

            /**
             * Function: Setting Testing Excel Import (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.SETTING_FILE_TESTING_EXCEL_IMPORT_PREVIEW]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    post: [async function(req, res) {
                        const {
                            listItemImport,
                            condition
                        } = req.body;

                        let conditionObj = TESTING_MODEL.getConditionArrayFilterExcel(listItemImport);

                        let historyImportColl = await MANAGE_COLL_MODEL.insertHistoryImport({
                            coll: conditionObj.refParent,
                            arrayFieldChoice: conditionObj.arrayItemCustomerChoice,
                            listItemImport,
                            condition
                        });
                        res.json(historyImportColl)
                    }]
                },
            },

            /**
             * Function: Download Testing Excel Import (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.DOWNLOAD_FILE_TESTING_EXCEL_IMPORT]: {
                config: {
                    scopes: ['read:list_testing'],
                    type: 'json',
                },
                methods: {
                    get: [async function(req, res) {

                        let listFieldHistoryImportColl = await MANAGE_COLL_MODEL.getInfoImport({
                            name: 'testing'
                        });

                        let listTestingImport = await TESTING_MODEL.fileImportExcelPreview({
                            arrayItemCustomerChoice: listFieldHistoryImportColl.listCollChoice
                        });

                        res.download(listTestingImport.pathWriteFile, function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                // Remove file on server
                                fs.unlinkSync(listTestingImport.pathWriteFile);
                            }
                        });
                    }]
                },
            },

            /**
             * Function: Upload Testing Excel Import (API)
             * Date: 30/11/2021
             * Dev: Automatic
             */
            [CF_ROUTINGS_TESTING.CREATE_TESTING_IMPORT_EXCEL]: {
                config: {
                    scopes: ['create:testing'],
                    type: 'json',
                },
                methods: {
                    post: [uploadSingle, async function(req, res) {

                        let listFieldHistoryImportColl = await MANAGE_COLL_MODEL.getInfoImport({
                            name: 'testing'
                        });

                        let infoTestingAfterImport = await TESTING_MODEL.importExcel({
                            arrayItemCustomerChoice: listFieldHistoryImportColl.listCollChoice,
                            file: req.file,
                            nameCollParent: 'testing',
                        });

                        res.json(infoTestingAfterImport);
                    }]
                },
            },

        }
    }
};