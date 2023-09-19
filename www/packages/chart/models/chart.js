"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                              = require('mongoose').Types.ObjectId;
const jwt                                   = require('jsonwebtoken');
const { hash, hashSync, compare }           = require('bcryptjs');
const mongodb                               = require("mongodb");
const { MongoClient }                       = mongodb;
const pluralize                             = require('pluralize');
const URL_DATABASE = process.env.URL_DATABASE || 'mongodb://localhost:27017';
const NAME_DATABASE = process.env.NAME_DATABASE || 'nandio_staging2';
/**
 * INTERNAL PACKAGE
 */
const { validEmail, validUserName }	        = require('../../../utils/string_utils');
const { getCurrentTime }	                = require('../../../utils/time_utils');
const { isEmptyObject, checkObjectIDs, loadPathImage }     = require('../../../utils/utils');
const BaseModel 					        = require('../../../models/intalize/base_model');
const MANAGE_COLL                           = require('../../../database/manage_coll-coll');
const TYPE_COLL                             = require('../../../database/type_coll-coll');

/**
 * CONSTANTS
 */


/**
 * MODELS
 */

/**
 * COLLECTIONS
 */
const CHART_COLL  					= require('../databases/chart-coll');
const MANAGE_CHART_COLL  			= require('../databases/manage-chart-coll');


class Model extends BaseModel {
    constructor() {
        super(CHART_COLL);

        this.STATUS_USER_ACTIVE     = 1;
        this.STATUS_USER_INACTIVE   = 2;

        this.SIMPLE      = 'SIMPLE';
        this.QUERY       = 'QUERY';
        this.API         = 'API';
        this.ARR_TYPE_VALID      = ['SIMPLE', 'QUERY', 'API'];
    }
/**
     * Tạo mới user
     * @param {string} name
     * @param {string} description
     * @param {string} type_chart
     * @param {enum} data_source
     * @param {object} data_source_obj
     * @this {BaseModel}
     * @returns {Promise}
     */
    insert({ 
        name,
        description,
        format_chart,
        type_chart,
        data_source,
        data_source_obj,
        manage_chart,
        col,
    }) {
        return new Promise(async resolve => {
            try {
                if (!name) {
                    return resolve({ error: true, message: 'Tên Chart không hợp lệ' });
                }

                if (!description) {
                    return resolve({ error: true, message: 'Mô tả Chart không hợp lệ' });
                }

                if (!type_chart) {
                    return resolve({ error: true, message: 'Loại Chart không hợp lệ' });
                }

                if (!data_source || !this.ARR_TYPE_VALID.includes(data_source)) {
                    return resolve({ error: true, message: 'Loại Data Source không hợp lệ' });
                }

                if (isEmptyObject(data_source_obj)) {
                    return resolve({ error: true, message: 'Dữ liệu Data Source không hợp lệ' });
                }

                let dataInsert = {
                    name,
                    description,
                    type_chart,
                    data_source,
                    data_source_obj,
                    
                }

                manage_chart && (dataInsert.manage_chart = manage_chart);
                col          && (dataInsert.col          = col);
                format_chart && (dataInsert.format_chart = format_chart);

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Tạo Chart thất bại' });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    insert__ManageChart({ 
        name,
        description,
        folderName,
        pathSave,
        arrChart
    }) {
        return new Promise(async resolve => {
            try {
                if (!name) {
                    return resolve({ error: true, message: 'Tên thống kê không hợp lệ' });
                }

                if (!description) {
                    return resolve({ error: true, message: 'Mô tả thống kê không hợp lệ' });
                }

                if (!folderName) {
                    return resolve({ error: true, message: 'Tên Folder không hợp lệ' });
                }

                if (!pathSave) {
                    return resolve({ error: true, message: 'Đường dẫn không hợp lệ' });
                }

                let dataInsert = {
                    name,
                    description,
                    folderName,
                    pathSave,
                    createAt: new Date(),
                    modifyAt: new Date(),
                }

                let checkExist = await MANAGE_CHART_COLL.findOne({
                    name
                });

                let infoAfterInsert;
                if (checkExist) {
                    infoAfterInsert = await MANAGE_CHART_COLL.findByIdAndUpdate(checkExist._id, dataInsert, { new: true });
                } else {
                    infoAfterInsert = await MANAGE_CHART_COLL.create(dataInsert);
                }
                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Tạo thống kê thất bại' });

                await CHART_COLL.deleteMany({
                    manage_chart: infoAfterInsert._id
                });
                let listChart = arrChart.map(item => {
                    console.log({
                        item
                    });
                    return this.insert({ 
                        ...item,
                        type_chart: item.TYPE_NAME,
                        data_source_obj: item.conditionDataSource,
                        manage_chart: infoAfterInsert._id
                    });
                });
                let result = await Promise.all(listChart);

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getManageChart({ 
        name,
    }) {
        return new Promise(async resolve => {
            try {
                if (!name) {
                    return resolve({ error: true, message: 'Tên thống kê không hợp lệ' });
                }

                let infoManageChart = await MANAGE_CHART_COLL.findOne({
                    name
                });

                if (!infoManageChart) {
                    return resolve({ error: true, message: 'Chart không tồn tại' });
                }
               
                let listChart = await CHART_COLL.find({
                    manage_chart: infoManageChart._id
                });

                if (!listChart) {
                    return resolve({ error: true, message: 'Chart không tồn tại' });
                }
                // const client = await MongoClient.connect(URL_DATABASE);
                // const db     = client.db(NAME_DATABASE);

                const url = 'mongodb://localhost:27017';
                const client = new MongoClient(url);

                // Database Name
                const dbName = 'nandio_staging2';
                await client.connect();
                console.log('Connected successfully to server');
                const db = client.db(dbName);
                const aaaa = await db.collection('checkin_checkouts').findOne({
              
                });

                console.log({
                    aaaa
                });

                // let listDataOfChart = listChart && listChart.length && listChart.map(item => {
                //     let conditionArr = [
                //         {
                //             $group: {
                //                 _id: `$${item.data_source_obj.relationship_mapping}`,
                //                 listData: {
                //                     $addToSet: "$$CURRENT"
                //                 },
                //             }
                //         },
                //         {
                //             $lookup: {
                //                 from: pluralize.plural(item.data_source_obj.coll),
                //                 localField: "_id",
                //                 foreignField: "_id",
                //                 as: "_id"
                //             }
                //         },
                //         {
                //             $unwind: {
                //                 path: '$_id',
                //             },
                //         }
                //     ];
                   
                //     return db.collection(pluralize.plural(item.data_source_obj.relationship)).aggregate(conditionArr);
                // });

                // let collName = pluralize.plural(arrayItemCustomerChoice[indexOfListField].ref);
                // let checkPluralColl = collName[collName.length - 1];

                // if (checkPluralColl.toLowerCase() != 's') {
                //     collName += 's';
                // }
                
                // const docs = await db.collection(collName).findOne({
                //     [arrayItemCustomerChoice[indexOfListField].variable]: valueDynamic.trim()
                // });

                // let docs = await db.collection('checkin_checkouts').find({});
                
                console.log({
                    collection
                });
                
                // let result = await Promise.all(listDataOfChart);
               

                // return resolve({ error: false, data: result });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getChart({ 
        name, 
        start, length, order
    }) {
        return new Promise(async resolve => {
            try {
                if (!name) {
                    return resolve({ error: true, message: 'Tên thống kê không hợp lệ' });
                }
               
                let infoChart = await CHART_COLL.findOne({
                    name
                });
            
                if (!infoChart) {
                    return resolve({ error: true, message: 'Chart không tồn tại' });
                }
                // const client = await MongoClient.connect(URL_DATABASE);
                // const db     = client.db(NAME_DATABASE);
                // console.log({
                //     client,
                //     NAME_DATABASE,
                //     URL_DATABASE
                // });

                const url = 'mongodb://localhost:27017';
                const client = new MongoClient(url);

                // Database Name
                const dbName = 'nandio_staging2';
                await client.connect();
                console.log('Connected successfully to server');
                const db = client.db(dbName);
               
                let data;
                switch (infoChart.type_chart) {
                    case "LEADERBOARD":
                        data = await this.getDataBy__Leaderboard({ 
                            infoChart, db, start, length, order
                        });
                        break;
                    case "TIME_BASED":
                        data = await this.getDataBy__TimeBased({ 
                            infoChart, db
                        });
                        break;
                    default:
                        break;
                }

                return resolve(data);
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getDataBy__Leaderboard({ 
        infoChart, db, start, length, order
    }) {
        return new Promise(async resolve => {
            try {
                let conditionArr = [];
                let coll = await MANAGE_COLL.findOne({
                    name: infoChart.data_source_obj.coll
                });

                let lookupOfLabel = [];
                let arrayLabelOfRefShow = [];
                let getInfoTypeColl = async (coll, name) => {
                    let infoTypeColl = await TYPE_COLL.findOne({
                        coll, name
                    });
                    if (infoTypeColl.ref) {
                        let lookup = [
                            {
                                $lookup: {
                                    from: pluralize.plural(infoTypeColl.ref),
                                    localField: `_id.${infoTypeColl.name}`,
                                    foreignField: "_id",
                                    as: `_id.${infoTypeColl.name}`
                                },
                            },
                            {
                                $unwind: {
                                    path: `$_id.${infoTypeColl.name}`,
                                    preserveNullAndEmptyArrays: true
                                },
                            },
                        ];
                       
                        arrayLabelOfRefShow = [
                            ...arrayLabelOfRefShow,
                            {
                                name,
                                fieldShow: `${infoTypeColl.refShow}`,
                                isImage: infoTypeColl.isImage ? true: false
                            }
                        ];
                        
                        lookupOfLabel = [
                            ...lookupOfLabel,
                            ...lookup
                        ];
                    }
                }
                let lookupOfRef = infoChart.data_source_obj.label.map(elem => {
                    return getInfoTypeColl(coll._id, elem);
                });
                await Promise.all(lookupOfRef); 
                
                switch (infoChart.data_source) {
                    case "SIMPLE":
                        let conditionObjGroup = {
                            _id: `$${infoChart.data_source_obj.relationship_mapping}`,
                            listData: {
                                $addToSet: "$$CURRENT"
                            },
                        };

                        let conditionSort = {};
                        if (infoChart.data_source_obj.view == "COUNT") {
                            conditionObjGroup.count = { $sum: 1 };
                            conditionSort = { 
                                count: -1
                            };
                        } else {
                            conditionObjGroup.sum = { $sum: `$${infoChart.data_source_obj.value}` };
                            conditionSort = { 
                                sum: -1
                            };
                        }

                        const page = Number(start) / Number(length) + 1;
                        let skip = (page - 1) * Number(infoChart.data_source_obj.limit);
                      
                        conditionArr = [
                            {
                                $group: conditionObjGroup
                            },
                            {
                                $lookup: {
                                    from: pluralize.plural(infoChart.data_source_obj.coll),
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "_id"
                                }
                            },
                            {
                                $unwind: {
                                    path: '$_id',
                                },
                            },
                            ...lookupOfLabel,
                            { 
                                $sort: conditionSort
                            },
                            { 
                                $skip: +skip 
                            },
                            { 
                                $limit : Number(infoChart.data_source_obj.limit) 
                            }
                        ];
                        break;
                    case "QUERY":
                        conditionArr = JSON.parse(infoChart.data_source_obj.query);
                        
                        break;
                    default:
                        break;
                }
               
                let cursor = await db.collection(pluralize.plural(infoChart.data_source_obj.relationship)).aggregate(conditionArr);
                const allValues = await cursor.toArray();
               
                const LIMIT_DEFAULT = 10;
                let listData = allValues.map((item, index) => {
                    let conditionLabel = {};
                    infoChart.data_source_obj.label.map(elem => {
                        let flag = false;
                        if (arrayLabelOfRefShow && arrayLabelOfRefShow.length) {
                            arrayLabelOfRefShow.map(ref => {
                                if (ref.name == elem) {
                                    flag = true;
                                    let fieldShow = item._id[elem];
                                    if (ref.isImage) {
                                        conditionLabel = {
                                            ...conditionLabel,
                                            [elem]: fieldShow['path'] ? `<img src="${loadPathImage(fieldShow['path'])}" alt="" class="thumb-xxl img-thumbnail">` : ''
                                        }
                                    } else {
                                        conditionLabel = {
                                            ...conditionLabel,
                                            [elem]: fieldShow[ref.fieldShow]
                                        }
                                    }
                                }
                            });
                        } 
                        
                        if (!flag || !arrayLabelOfRefShow || !arrayLabelOfRefShow.length) {
                            conditionLabel = {
                                ...conditionLabel,
                                [elem]: item._id[elem]
                            }
                        }
                    });
                   
                    if (item.count || item.count == 0) {
                        conditionLabel.total = item.count;
                    } else {
                        conditionLabel.total = item.sum;
                    }
                    
                    const page = Number(start) / Number(length) + 1;
                    let skip = (page - 1) * (infoChart.data_source_obj.limit ? Number(infoChart.data_source_obj.limit): LIMIT_DEFAULT);
                  
                    return {
                        index: skip + index + 1,
                        ...conditionLabel,
                    }
                });

                let recordsTotal    = (infoChart.data_source_obj.limit ? Number(infoChart.data_source_obj.limit): LIMIT_DEFAULT);
				let recordsFiltered = (infoChart.data_source_obj.limit ? Number(infoChart.data_source_obj.limit): LIMIT_DEFAULT);

                return resolve({ error: false, data: listData, recordsTotal, recordsFiltered });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    getDataBy__TimeBased({ 
        infoChart, db
    }) {
        return new Promise(async resolve => {
            try {
                let conditionArr = [];
               
                switch (infoChart.data_source) {
                    case "SIMPLE":
                        let conditionObjGroup = {
                            _id: {
                                year: { $year: `$${infoChart.data_source_obj.group_by}` }  
                            },
                            listData: {
                                $addToSet: "$$CURRENT"
                            },
                        };

                        let conditionSort = {};
                        switch (infoChart.data_source_obj.timeframe) {
                            case 'DAY':
                                conditionSort["_id.month"] = 1;
                                conditionSort["_id.day"]   = 1;
                                conditionObjGroup._id.day   = { $dayOfMonth: `$${infoChart.data_source_obj.group_by}` };
                                conditionObjGroup._id.month = { $month: `$${infoChart.data_source_obj.group_by}` };
                                break;
                            case 'WEEK':
                                
                                break;
                            case 'MONTH':
                                conditionSort["_id.month"] = 1;
                                conditionObjGroup._id.month = { $month: `$${infoChart.data_source_obj.group_by}` };
                                break;
                            default:
                                break;
                        }
                        
                        if (infoChart.data_source_obj.view == "COUNT") {
                            conditionObjGroup.count = { $sum: 1 };
                        } else {
                            conditionObjGroup.sum = { $sum: `$${infoChart.data_source_obj.value}` };
                        }
                       
                        conditionArr = [
                            {
                                $group: {
                                    ...conditionObjGroup
                                }
                            },
                            { 
                                $sort: {
                                    "_id.year": 1,
                                    ...conditionSort
                                }
                            },
                        ];
                        break;
                    case "QUERY":
                        conditionArr = JSON.parse(infoChart.data_source_obj.query);
                        
                        break;
                    default:
                        break;
                }
                
                let cursor = await db.collection(pluralize.plural(infoChart.data_source_obj.coll)).aggregate(conditionArr);
                const allValues = await cursor.toArray();
               
                return resolve({ error: false, data: allValues, infoChart });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

}

exports.MODEL = new Model;
