"use strict";

/**
 * EXTERNAL PACKAGE
 */
const moment        = require("moment");
const v8            = require('v8');
const OS            = require("os");

/**
 * INTERNAL PACKAGE
 */
const ChildRouter                               = require('../../../routing/child_routing');
const { CF_ROUTINGS_MONITOR }                   = require('../constants/monitor.uri');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== **************** ================================
             * ========================== QUẢN LÝ MONITOR  ================================
             * ========================== **************** ================================
             */

            /**
             * Function: Check healthy (API)
             * Date: 21/12/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_MONITOR.CHECK_HEALTH]: {
                config: {
					scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        const data = {
                            uptime: process.uptime(),
                            status: 200,
                            message: 'Ok man',
                            date: moment(new Date()).format('DD/MM/YYYY HH:mm:ss Z')
                        }
                        
                        res.status(200).send(data);
                    }]
                },
            },

            /**
             * Function: Check Version (API)
             * Date: 21/12/2021
             * Dev: MinhVH
             */
            [CF_ROUTINGS_MONITOR.CHECK_VERSION]: {
                config: {
					scopes: ['public'],
					type: 'json',
                },
                methods: {
                    get: [ (req, res) => {
                        // let num_processes = +process.env.NUMBER_PROCESSOR || OS.cpus().length;
                        // let totalHeapSize = v8.getHeapStatistics().total_available_size;
                        // totalHeapSize     = totalHeapSize / 1024 / 1024 / 1024

                        res.status(200).json({
                            version: process.versions,
                        });
                    }]
                },
            },

        }
    }
};
