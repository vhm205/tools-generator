"use strict";

/**
 * EXTERNAL PACKAGE
 */

/**
 * INTERNAL PACKAGE
 */
const BaseModel                     = require('../../../models/intalize/base_model');

/**
 * MODULE
 */
const INIT_QUEUE                    = require('../../../queue/initQueue')('TRIGGER_EVENT_QUEUE');

/**
 * COLLECTIONS
 */
const TRIGGER_EVENT_COLL            = require('../databases/event.noti-coll');
const FUNCTION_COLL                 = require('../databases/function-coll');
const TEMPLATE_NOTI_COLL            = require('../databases/template.noti-coll');


class Model extends BaseModel{
    constructor() {
        super(TRIGGER_EVENT_COLL);
    }

    /**
     * Create functions
     * @param {array} functions
     * @this {Model}
     * @returns {Promise}
     */
    insertFunctions({ functions }){
        return new Promise(async resolve => {
            try {
                if(!functions.length) return resolve({ error: true, message: 'Functions không hợp lệ' });

                // const listAfterFilterDuplicate = [];

                // for (const func of functions) {
                //     const checkExistsFunc = await FUNCTION_COLL.findOne({
                //         $or: [
                //             { name: func.name.trim() },
                //             { code: func.code.trim() },
                //         ]
                //     }).select('_id').lean();

                //     if(!checkExistsFunc){
                //         listAfterFilterDuplicate[listAfterFilterDuplicate.length] = func;
                //     }
                // }
                await FUNCTION_COLL.deleteMany({});

                const functionsAsync = functions.map(func => FUNCTION_COLL.create({
                    name: func.name, 
                    code: func.code, 
                    module: func.module, 
                    model: func.model, 
                    description: func.note,
                    status: 'IN_ACTIVE'
                }));

                const infoAfterCreateFunctions = await Promise.all(functionsAsync);

                return resolve({ error: false, data: infoAfterCreateFunctions });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Create templates
     * @param {array} templates
     * @this {Model}
     * @returns {Promise}
     */
    insertTemplates({ templates }){
        return new Promise(async resolve => {
            try {
                if(!templates.length) return resolve({ error: true, message: 'templates không hợp lệ' });

                const listTemplates = [];

                for (const template of templates) {
                    const { title, content, params, meta, type, module, model, func } = template;

                    const infoFunc = await FUNCTION_COLL
                        .findOne({ name: func, module, model })
                        .select('_id')
                        .lean();

                    if(infoFunc) {
                        listTemplates[listTemplates.length] = {
                            title, content, params, meta, type, func: infoFunc._id
                        };
                    }
                }

                await TEMPLATE_NOTI_COLL.deleteMany({});
                const templatesAsync = listTemplates.map(template => TEMPLATE_NOTI_COLL.create({
                    title: template.title, 
                    func: template.func, 
                    content: template.content, 
                    description: template.note,
                    params: template.params, 
                    meta: template.meta,
                    type: template.type
                }));

                const infoAfterCreateTemplates = await Promise.all(templatesAsync);

                if(!infoAfterCreateTemplates.length)
                    return resolve({ error: true, message: "Tạo template thất bại" });

                const templatesGrouped = await TEMPLATE_NOTI_COLL.aggregate([
                    {
                        $lookup: {
                            from: "functions",
                            localField: "func",
                            foreignField: "_id",
                            as: "func"
                        }
                    },
                    {
                        $group: {
                            _id: "$func._id",
                            moduleName: { $first: "$func.module" },
                            modelName: { $first: "$func.model" },
                            functionName: { $first: "$func.name" },
                            data: { $push: "$$ROOT" }
                        }
                    },
                    { $sort: { _id: -1 } }
                ]);

                return resolve({ error: false, data: templatesGrouped });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Create events
     * @param {array} events
     * @this {Model}
     * @returns {Promise}
     */
    insertEvents({ events }){
        return new Promise(async resolve => {
            try {
                if(!events.length) return resolve({ error: true, message: 'Events không hợp lệ' });

                await this.deleteMany({});

                const listFuncID = events.map(event => event.funcID);
                const eventsAsync = events.map(event => this.insertData({
                    templateNoti: event.templateID, 
                    func: event.funcID, 
                    queueName: event.queueName, 
                    queueURL: event.queueURL, 
                    status: 'ACTIVE'
                }));

                const infoAfterCreateEvents = await Promise.all(eventsAsync);

                // Kích hoạt trạng thái function
                await FUNCTION_COLL.updateMany({}, { $set: { status: 'IN_ACTIVE' } });
                await FUNCTION_COLL.updateMany({
                    _id: { $in: listFuncID }
                }, {
                    $set: { status: 'ACTIVE' }
                });

                return resolve({ error: false, data: infoAfterCreateEvents });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Check Event for trigger
     * @param {array} 
     * @this {Model}
     * @returns {Promise}
     */
    triggerEvent({ func, receiver, params }){
        return new Promise(async resolve => {
            try {
                if(process.env.TRIGGER_EVENT_NOTI_QUEUE !== 'true')
                    return resolve({ error: false, message: 'Trigger event is not active' });

                const opts = { 
                    attempts: 5, 
                    backoff: 3000,
                    delay: 1500,
                    removeOnComplete: true,
                    // removeOnFail: true,
                    // jobId: randomStringFixLength(25),
                }

                await INIT_QUEUE.add({ func, receiver, params }, opts);

                return resolve({ error: false, message: 'Passed!!' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
