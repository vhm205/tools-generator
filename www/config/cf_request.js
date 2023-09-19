"use strict";

const express 			    = require('express');
const helmet                = require('helmet');
const busboy                = require('connect-busboy');
const compression           = require('compression');
const morganMiddleware      = require('./logger/morganMiddleware');

// Bull Queue
const Queue                 = require('bull');
const { ExpressAdapter }    = require('@bull-board/express');
const { createBullBoard }   = require('@bull-board/api');
const { BullAdapter }       = require('@bull-board/api/bullAdapter');

module.exports = function (app) {
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000000 }));

    app.use(compression({ 
        threshold: 100 * 1000,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                // don't compress responses with this request header
                return false;
            }

            // fallback to standard filter function
            return compression.filter(req, res)
        }
    }));

    app.use(busboy({
        highWaterMark: 10 * 1024 * 1024, // 10 MB buffer
        limits: {
            fileSize: 10 * 1024 * 1024
        }
    }));

    app.use(helmet.hidePoweredBy());
    app.use(helmet.xssFilter());
	app.use(morganMiddleware);

    const queues = new Queue('TRIGGER_EVENT_QUEUE');
    const serverAdapter = new ExpressAdapter();

    createBullBoard({
        queues: [
            new BullAdapter(queues), // { readOnlyMode: true } only this queue will be in read only mode
        ],
        serverAdapter
    });

    serverAdapter.setBasePath('/admin/queues');
    app.use('/admin/queues', serverAdapter.getRouter());
};
