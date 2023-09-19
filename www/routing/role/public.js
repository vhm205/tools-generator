"use strict";

const ChildRouter                           = require('../child_routing');

const TYPE_COLLECTION_COLL                  = require('../../database/type_coll-coll');
const { MODEL: MANAGE_COLLECTION_MODEL }    = require('../../models/manage_coll');

module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ******************** ================================
             * ========================== QUẢN LÝ ROUTE PUBLIC ================================
             * ========================== ******************** ================================
             */

            '/': {
                config: {
					scopes: ['public'],
                    type: 'view',
                },
                methods: {
                    get: [(_, res) => res.redirect('/admin/generate-tools')]
                }
            },

            '/get-info-coll': {
                config: {
					scopes: ['public'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
                        let { nameColl } = req.query;

                        let checkExists = await MANAGE_COLLECTION_MODEL.getInfo({
                            name: nameColl
                        });

                        let condition = {
                            coll: checkExists.data._id, isOrder: false, isImage: false 
                        }
                        
                        let listField = await TYPE_COLLECTION_COLL.find(condition);

                        res.json({ error: false, data: listField, listHistoryChoice: checkExists.listCollChoice, collChoice: checkExists });
                    }]
                },
            },

            '/get-info-coll-import': {
                config: {
					scopes: ['public'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
                        let { nameColl } = req.query;

                        let checkExists = await MANAGE_COLLECTION_MODEL.getInfoImport({
                            name: nameColl
                        });

                        let condition = {
                            coll: checkExists.data._id, isImage: false, isImport: true
                        }

                        let listField = await TYPE_COLLECTION_COLL.find(condition);
                        
                        res.json({ error: false, data: listField, listHistoryChoice: checkExists.listCollChoice, collChoice: checkExists });
                    }]
                },
            },

            '/filter-by-coll': {
                config: {
					scopes: ['public'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
                        let { nameColl, offcanvasID } = req.query;

                        let checkExists = await MANAGE_COLLECTION_MODEL.getInfo({
                            name: nameColl
                        });
                       
                        let condition = {
                            coll: checkExists.data._id
                        }
                      
                        let listField = await TYPE_COLLECTION_COLL.find(condition);

                        let filter = await MANAGE_COLLECTION_MODEL.renderFilter({
                            fields: listField, offcanvasID
                        });
                        
                        res.json(filter);
                    }]
                },
            },

        }
    }
};
