"use strict";

/**
 * EXTERNAL PACKAGE
 */
const path = require('path');

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                           = require('../../../routing/child_routing');
const { CF_ROUTINGS_CHART }                 = require('../constants/chart.uri');
const { 
    generateView,
    generateApi
} = require('../../../tools/chart');

/**
 * MODELS
 */
const CHART_MODEL 					    = require('../models/chart').MODEL;

/**
 * COLLECTIONS
 */
 const MANAGE_COLLECTION_COLL                = require('../../../database/manage_coll-coll');
 const TYPE_COLLECTION_COLL                  = require('../../../database/type_coll-coll');

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
            [CF_ROUTINGS_CHART.GENERATE_CHART]: {
                config: {
					scopes: ['supervisor'],
					type: 'view',
                    view: 'index.ejs',
					title: 'Power Of LDK - LDK SOFTWARE',
					code: 'CHART',
                    inc: path.resolve(__dirname, '../views/generate_charts.ejs'),
				},
				methods: {
                    get: [ async function (req, res) {
                        let listCollections = await MANAGE_COLLECTION_COLL.find({}).lean();

                        ChildRouter.renderToView(req, res, { 
                            listCollections,
                        });
                    }],
                    post: [ async function (req, res) {
                        let {
                            name,
                            description,
                            TYPE_NAME: type_chart,
                            data_source,
                            conditionDataSource: data_source_obj,
                            manage_chart
                        } = req.body;
                        
                        let infoChartAfterInsert = await CHART_MODEL.insert({ 
                            name,
                            description,
                            type_chart,
                            data_source,
                            data_source_obj,
                            manage_chart
                        });
                     
                        return res.json(infoChartAfterInsert);
                    }],
				},
            },

            /**
             * Function: Generate code OTP (API)
             * Date: ...
             * Dev: MinhVH
             */
             [CF_ROUTINGS_CHART.ADD_MANAGE_CHART]: {
                config: {
					scopes: ['supervisor'],
					type: 'json',
				},
				methods: {
                    post: [ async function (req, res) {
                        let {
                            name,
                            description,
                            folderName,
                            pathSave,
                            arrChart
                        } = req.body;
                        
                        const blacklistPackage = ['auth', 'common', 'image', 'users', 'upload-s3'];

						if(blacklistPackage.includes(folderName.toLowerCase())){
                            return res.json({ error: true, message: 'Tên folder không được phép sử dụng' });
						}

                        let infoChartAfterInsert = await CHART_MODEL.insert__ManageChart({ 
                            name,
                            description,
                            folderName,
                            pathSave,
                            arrChart
                        });
                        console.log({
                            infoChartAfterInsert
                        });
                        // await generateSchema(name, description, folderName, arrChart);
                        console.log("-----------------generateView-----------------");
                        await generateView(name, description, pathSave, folderName, arrChart);
                        console.log("-----------------generateView-----------------");
                        console.log("-----------------generateApi-----------------");
                        await generateApi(name, description, pathSave, folderName, arrChart);
                        console.log("-----------------generateApi-----------------");

                        return res.json(infoChartAfterInsert);
                    }],
				},
            },

            [CF_ROUTINGS_CHART.GET_MANAGE_CHART]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    get: [ async function (req, res) {
                        let {
                            name,
                        } = req.query;
                     
                        let infoChartAfterInsert = await CHART_MODEL. getManageChart({ 
                            name,
                        });

                        return res.json(infoChartAfterInsert);
                    }],
				},
            },

            [CF_ROUTINGS_CHART.GET_CHART]: {
                config: {
					scopes: ['public'],
					type: 'json',
				},
				methods: {
                    post: [ async function (req, res) {
                        let {
                            name, 
                        } = req.query;

                        let  {
                            start, length, order
                        } = req.body;

                        let infoChartAfterInsert = await CHART_MODEL.getChart({ 
                            name, 
                            start, length, order
                        });
                        console.log({
                            infoChartAfterInsert
                        });

                        // await generateSchema(name, description, folderName, arrChart);
                        return res.json(infoChartAfterInsert);
                    }],
				},
            },

        }
    }
};
