"use strict";

/**
 * EXTERNAL PACKAGE
 */
const moment = require('moment');
const pluralize = require('pluralize');
const fastcsv = require('fast-csv');
const HOST_PROD = process.env.HOST_PROD || 'localhost';
const PORT_PROD = process.env.PORT_PROD || '5000';
const domain = HOST_PROD + ":" + PORT_PROD;
const URL_DATABASE = process.env.URL_DATABASE || 'mongodb://localhost:27017';
const NAME_DATABASE = process.env.NAME_DATABASE || 'ldk_tools_op';
const path = require('path');
const fs = require('fs');
const XlsxPopulate = require('xlsx-populate');
const mongodb = require("mongodb");
const {
    MongoClient
} = mongodb;
const formatCurrency = require('number-format.js');

/**
 * INTERNAL PACKAGE
 */
const {
    checkObjectIDs,
    cleanObject,
    colName,
} = require('../../../utils/utils');
const {
    isTrue
} = require('../../../tools/module/check');

/**
 * BASE
 */
const BaseModel = require('../../../models/intalize/base_model');

/**
 * COLLECTIONS
 */
const TESTING_COLL = require('../databases/testing-coll');

const {
    IMAGE_COLL
} = require('../../image');


class Model extends BaseModel {
    constructor() {
        super(TESTING_COLL);
    }

    /**
         * Tạo mới testing
		* @param {array} images
		* @param {object} avatar
		* @param {array} images2
		* @param {number} price

         * @param {objectId} userCreate
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
    insert({
        images,
        avatar,
        images2,
        price,
        userCreate
    }) {
        return new Promise(async resolve => {
            try {
                if (userCreate && !checkObjectIDs([userCreate])) {
                    return resolve({
                        error: true,
                        message: 'Người tạo không hợp lệ'
                    });
                }

                if (!price) {
                    return resolve({
                        error: true,
                        message: 'Bạn cần nhập giá'
                    });
                }





                if (!checkObjectIDs(images)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập không hợp lệ'
                    });
                }

                if (!checkObjectIDs([avatar])) {
                    return resolve({
                        error: true,
                        message: 'hình ảnh không hợp lệ'
                    });
                }

                if (!checkObjectIDs(images2)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập 2 không hợp lệ'
                    });
                }



                let dataInsert = {
                    images,
                    avatar,
                    images2,
                    price,
                    userCreate
                };


                dataInsert = cleanObject(dataInsert);
                let infoAfterInsert = await this.insertData(dataInsert);

                if (!infoAfterInsert) {
                    return resolve({
                        error: true,
                        message: 'Tạo testing thất bại'
                    });
                }

                return resolve({
                    error: false,
                    data: infoAfterInsert
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
         * Cập nhật testing 
         * @param {objectId} testingID
		* @param {array} images
		* @param {object} avatar
		* @param {array} images2
		* @param {number} price

         * @param {objectId} userUpdate
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
    update({
        testingID,
        images,
        avatar,
        images2,
        price,
        userUpdate
    }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([testingID])) {
                    return resolve({
                        error: true,
                        message: 'testingID không hợp lệ'
                    });
                }

                if (userUpdate && !checkObjectIDs([userUpdate])) {
                    return resolve({
                        error: true,
                        message: 'Người cập nhật không hợp lệ'
                    });
                }

                if (!price) {
                    return resolve({
                        error: true,
                        message: 'Bạn cần nhập giá cho testing'
                    });
                }





                if (!checkObjectIDs(images)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập không hợp lệ'
                    });
                }

                if (!checkObjectIDs([avatar])) {
                    return resolve({
                        error: true,
                        message: 'hình ảnh không hợp lệ'
                    });
                }

                if (!checkObjectIDs(images2)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập 2 không hợp lệ'
                    });
                }

                const checkExists = await TESTING_COLL.findById(testingID);
                if (!checkExists) {
                    return resolve({
                        error: true,
                        message: 'testing không tồn tại'
                    });
                }


                let dataUpdate = {
                    userUpdate
                };
                images && (dataUpdate.images = images);
                avatar && (dataUpdate.avatar = avatar);
                images2 && (dataUpdate.images2 = images2);
                price && (dataUpdate.price = price);

                let infoAfterUpdate = await this.updateWhereClause({
                    _id: testingID
                }, dataUpdate);

                if (!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: 'Cập nhật thất bại'
                    });
                }

                return resolve({
                    error: false,
                    data: infoAfterUpdate
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
         * Cập nhật testing (không bắt buộc)
         * @param {objectId} testingID
		* @param {array} images
		* @param {object} avatar
		* @param {array} images2
		* @param {number} price

         * @param {objectId} userUpdate
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
    updateNotRequire({
        testingID,
        images,
        avatar,
        images2,
        price,
        userUpdate
    }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([testingID])) {
                    return resolve({
                        error: true,
                        message: 'testingID không hợp lệ'
                    });
                }

                if (userUpdate && !checkObjectIDs([userUpdate])) {
                    return resolve({
                        error: true,
                        message: 'Người cập nhật không hợp lệ'
                    });
                }

                if (images && !checkObjectIDs(images)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập không hợp lệ'
                    });
                }

                if (avatar && !checkObjectIDs([avatar])) {
                    return resolve({
                        error: true,
                        message: 'hình ảnh không hợp lệ'
                    });
                }

                if (images2 && !checkObjectIDs(images2)) {
                    return resolve({
                        error: true,
                        message: 'bộ sưu tập 2 không hợp lệ'
                    });
                }

                const checkExists = await TESTING_COLL.findById(testingID);
                if (!checkExists) {
                    return resolve({
                        error: true,
                        message: 'testing không tồn tại'
                    });
                }

                let dataUpdate = {
                    userUpdate
                };
                images && (dataUpdate.images = images);
                avatar && (dataUpdate.avatar = avatar);
                images2 && (dataUpdate.images2 = images2);
                price && (dataUpdate.price = price);
                let infoAfterUpdate = await this.updateWhereClause({
                    _id: testingID
                }, dataUpdate);

                if (!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: 'Cập nhật thất bại'
                    });
                }

                return resolve({
                    error: false,
                    data: infoAfterUpdate
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Xóa testing 
     * @param {objectId} testingID
     * @this {BaseModel}
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: object, message?: string }}
     */
    deleteById(testingID) {
        return new Promise(async resolve => {
            try {
                let conditionObj = {
                    state: 2
                };
                if (!checkObjectIDs([testingID])) {
                    return resolve({
                        error: true,
                        message: 'Giá trị testingID không hợp lệ'
                    });
                }


                const infoAfterDelete = await this.updateById(testingID, conditionObj);

                return resolve({
                    error: false,
                    data: infoAfterDelete
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Xóa testing 
     * @param {array} testingID
     * @extends {BaseModel}
     * @returns {{ 
     *      error: boolean, 
     *      message?: string,
     *      data?: { "nMatched": number, "nUpserted": number, "nModified": number }, 
     * }}
     */
    deleteByListId(testingID) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(testingID)) {
                    return resolve({
                        error: true,
                        message: 'Giá trị testingID không hợp lệ'
                    });
                }

                const infoAfterDelete = await TESTING_COLL.deleteMany({
                    _id: {
                        $in: testingID
                    }
                });

                return resolve({
                    error: false,
                    data: infoAfterDelete
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy thông tin testing 
     * @param {objectId} testingID
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: object, message?: string }}
     */
    getInfoById(testingID) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([testingID])) {
                    return resolve({
                        error: true,
                        message: 'Giá trị testingID không hợp lệ'
                    });
                }

                const infoTesting = await TESTING_COLL.findById(testingID)
                    .populate('images avatar images2')

                if (!infoTesting) {
                    return resolve({
                        error: true,
                        message: 'Không thế lâý thông tin testing'
                    });
                }

                return resolve({
                    error: false,
                    data: infoTesting
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy danh sách testing 
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: array, message?: string }}
     */
    getList() {
        return new Promise(async resolve => {
            try {
                const listTesting = await TESTING_COLL
                    .find({
                        state: 1
                    }).populate('images avatar images2')
                    .sort({
                        modifyAt: -1
                    })
                    .lean();

                if (!listTesting) {
                    return resolve({
                        error: true,
                        message: 'Không thể lấy danh sách testing'
                    });
                }

                return resolve({
                    error: false,
                    data: listTesting
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
         * Lấy danh sách testing theo bộ lọc
		* @param {number} priceFromNumber
		* @param {number} priceToNumber

         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: array, message?: string }}
         */
    getListByFilter({
        priceFromNumber,
        priceToNumber,
    }) {
        return new Promise(async resolve => {
            try {
                let conditionObj = {
                    state: 1
                };


                if (priceFromNumber && priceToNumber) {
                    conditionObj.price = {
                        $gte: priceFromNumber,
                        $lt: priceToNumber,
                    };
                }


                const listTestingByFilter = await TESTING_COLL
                    .find(conditionObj).populate('images avatar images2')
                    .sort({
                        modifyAt: -1
                    })
                    .lean();

                if (!listTestingByFilter) {
                    return resolve({
                        error: true,
                        message: "Không thể lấy danh sách testing"
                    });
                }

                return resolve({
                    error: false,
                    data: listTestingByFilter
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy danh sách testing theo bộ lọc (server side)
     
     * @param {string} keyword
     * @param {array} filter
     * @param {string} condition
     
     * @param {number} page
     * @param {number} limit
     * @param {string} field
     * @param {string} dir
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: object, message?: string }}
     */
    getListByFilterServerSide({
        keyword,
        filter,
        condition,
        objFilterStatic,
        page,
        limit,
        field,
        dir
    }) {
        return new Promise(async resolve => {
            try {
                if (isNaN(page)) page = 1;
                if (isNaN(limit)) limit = 25;

                let conditionObj = {
                    state: 1,
                    $or: []
                };




                if (filter && filter.length) {
                    if (filter.length > 1) {

                        filter.map(filterObj => {
                            if (filterObj.type === 'ref') {
                                const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);

                                if (condition === 'OR') {
                                    conditionObj.$or.push(conditionFieldRef);
                                } else {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...conditionFieldRef
                                    };
                                }
                            } else {
                                const conditionByFilter = this.getConditionObj(filterObj);

                                if (condition === 'OR') {
                                    conditionObj.$or.push(conditionByFilter);
                                } else {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...conditionByFilter
                                    };
                                }
                            }
                        });

                    } else {
                        let {
                            type,
                            ref,
                            fieldRefName
                        } = filter[0];

                        if (type === 'ref') {
                            conditionObj = {
                                ...conditionObj,
                                ...this.getConditionObj(ref, fieldRefName)
                            };
                        } else {
                            conditionObj = {
                                ...conditionObj,
                                ...this.getConditionObj(filter[0])
                            };
                        }
                    }
                }




                if (conditionObj.$or && !conditionObj.$or.length) {
                    delete conditionObj.$or;
                }

                let sort = {
                    modifyAt: -1
                };
                if (field && dir) {
                    if (dir == 'asc') {
                        sort = {
                            [field]: 1
                        }
                    } else {
                        sort = {
                            [field]: -1
                        }
                    }
                }

                const skip = (page - 1) * limit;
                const totalTesting = await TESTING_COLL.countDocuments(conditionObj);

                const listTestingByFilter = await TESTING_COLL.aggregate([

                    {
                        $lookup: {
                            from: 'images',
                            localField: 'avatar',
                            foreignField: '_id',
                            as: 'avatar'
                        }
                    },
                    {
                        $unwind: {
                            path: '$avatar',
                            preserveNullAndEmptyArrays: true
                        },
                    },

                    {
                        $match: conditionObj
                    },
                    {
                        $sort: sort
                    },
                    {
                        $skip: +skip
                    },
                    {
                        $limit: +limit
                    },
                ])

                if (!listTestingByFilter) {
                    return resolve({
                        recordsTotal: totalTesting,
                        recordsFiltered: totalTesting,
                        data: []
                    });
                }

                const listTestingDataTable = listTestingByFilter.map((testing, index) => {

                    return {
                        index: `<td class="text-center"><div class="checkbox checkbox-success text-center"><input id="${testing._id}" type="checkbox" class="check-record check-record-${testing._id}" _index ="${index + 1}"><label for="${testing._id}"></label></div></td>`,
                        indexSTT: skip + index + 1,
                        avatar: `${testing.avatar ? `<a class="user-avatar me-2 fancybox" href="${testing.avatar.path}"><img src="${testing.avatar.path}" alt="" class="thumb-xxl img-thumbnail"> </a>` : ""}`,
                        price: formatCurrency('###,###.', testing.price),
                        createAt: moment(testing.createAt).format('HH:mm DD/MM/YYYY'),
                    }
                });

                return resolve({
                    error: false,
                    recordsTotal: totalTesting,
                    recordsFiltered: totalTesting,
                    data: listTestingDataTable || []
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy danh sách testing theo bộ lọc import
     
     * @param {string} keyword
     * @param {array} filter
     * @param {string} condition
     
     * @param {number} page
     * @param {number} limit
     * @param {string} field
     * @param {string} dir
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: object, message?: string }}
     */
    getListByFilterImport({
        keyword,
        filter,
        condition,
        objFilterStatic,
        page,
        limit,
        field,
        dir
    }) {
        return new Promise(async resolve => {
            try {
                if (isNaN(page)) page = 1;
                if (isNaN(limit)) limit = 25;

                let conditionObj = {
                    state: 1,
                    $or: []
                };




                if (filter && filter.length) {
                    if (filter.length > 1) {

                        filter.map(filterObj => {
                            if (filterObj.type === 'ref') {
                                const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);

                                if (condition === 'OR') {
                                    conditionObj.$or.push(conditionFieldRef);
                                } else {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...conditionFieldRef
                                    };
                                }
                            } else {
                                const conditionByFilter = this.getConditionObj(filterObj);

                                if (condition === 'OR') {
                                    conditionObj.$or.push(conditionByFilter);
                                } else {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...conditionByFilter
                                    };
                                }
                            }
                        });

                    } else {
                        let {
                            type,
                            ref,
                            fieldRefName
                        } = filter[0];

                        if (type === 'ref') {
                            conditionObj = {
                                ...conditionObj,
                                ...this.getConditionObj(ref, fieldRefName)
                            };
                        } else {
                            conditionObj = {
                                ...conditionObj,
                                ...this.getConditionObj(filter[0])
                            };
                        }
                    }
                }



                if (conditionObj.$or && !conditionObj.$or.length) {
                    delete conditionObj.$or;
                }

                let sort = {
                    modifyAt: -1
                };
                if (field && dir) {
                    if (dir == 'asc') {
                        sort = {
                            [field]: 1
                        }
                    } else {
                        sort = {
                            [field]: -1
                        }
                    }
                }

                const skip = (page - 1) * limit;
                const totalTesting = await TESTING_COLL.countDocuments(conditionObj);

                const listTestingByFilter = await TESTING_COLL.aggregate([

                    {
                        $lookup: {
                            from: 'images',
                            localField: 'avatar',
                            foreignField: '_id',
                            as: 'avatar'
                        }
                    },
                    {
                        $unwind: {
                            path: '$avatar',
                            preserveNullAndEmptyArrays: true
                        },
                    },

                    {
                        $match: conditionObj
                    },
                    {
                        $sort: sort
                    },
                    {
                        $skip: +skip
                    },
                    {
                        $limit: +limit
                    },
                ])

                if (!listTestingByFilter) {
                    return resolve({
                        recordsTotal: totalTesting,
                        recordsFiltered: totalTesting,
                        data: []
                    });
                }

                return resolve({
                    error: false,
                    recordsTotal: totalTesting,
                    recordsFiltered: totalTesting,
                    data: listTestingByFilter || []
                });
            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy điều kiện lọc testing
     * @param {object} filter
     * @extends {BaseModel}
     * @returns {{ [key]: [value] }}
     */
    getConditionObj(filter, ref) {
        let {
            type,
            fieldName,
            cond,
            value
        } = filter;
        let conditionObj = {};

        if (ref) {
            fieldName = `${ref}.${fieldName}`;
        }

        switch (cond) {
            case 'equal': {
                if (type === 'date') {
                    let _fromDate = moment(value).startOf('day').format();
                    let _toDate = moment(value).endOf('day').format();

                    conditionObj[fieldName] = {
                        $gte: new Date(_fromDate),
                        $lte: new Date(_toDate)
                    }
                } else {
                    value = (type === 'number' || type === 'enum') ? +value : value;
                    conditionObj[fieldName] = value;
                }
                break;
            }
            case 'not-equal': {
                if (type === 'date') {
                    conditionObj[fieldName] = {
                        $ne: new Date(value)
                    };
                } else {
                    value = (type === 'number' || type === 'enum') ? +value : value;
                    conditionObj[fieldName] = {
                        $ne: value
                    };
                }
                break;
            }
            case 'greater-than': {
                conditionObj[fieldName] = {
                    $gt: +value
                };
                break;
            }
            case 'less-than': {
                conditionObj[fieldName] = {
                    $lt: +value
                };
                break;
            }
            case 'start-with': {
                conditionObj[fieldName] = {
                    $regex: '^' + value,
                    $options: 'i'
                };
                break;
            }
            case 'end-with': {
                conditionObj[fieldName] = {
                    $regex: value + '$',
                    $options: 'i'
                };
                break;
            }
            case 'is-contains': {
                let key = value.split(" ");
                key = '.*' + key.join(".*") + '.*';

                conditionObj[fieldName] = {
                    $regex: key,
                    $options: 'i'
                };
                break;
            }
            case 'not-contains': {
                conditionObj[fieldName] = {
                    $not: {
                        $regex: value,
                        $options: 'i'
                    }
                };
                break;
            }
            case 'before': {
                conditionObj[fieldName] = {
                    $lt: new Date(value)
                };
                break;
            }
            case 'after': {
                conditionObj[fieldName] = {
                    $gt: new Date(value)
                };
                break;
            }
            case 'today': {
                let _fromDate = moment(new Date()).startOf('day').format();
                let _toDate = moment(new Date()).endOf('day').format();

                conditionObj[fieldName] = {
                    $gte: new Date(_fromDate),
                    $lte: new Date(_toDate)
                }
                break;
            }
            case 'yesterday': {
                let yesterday = moment().add(-1, 'days');
                let _fromDate = moment(yesterday).startOf('day').format();
                let _toDate = moment(yesterday).endOf('day').format();

                conditionObj[fieldName] = {
                    $gte: new Date(_fromDate),
                    $lte: new Date(_toDate)
                }
                break;
            }
            case 'before-hours': {
                let beforeNHours = moment().add(-value, 'hours');
                let _fromDate = moment(beforeNHours).startOf('day').format();
                let _toDate = moment(beforeNHours).endOf('day').format();

                conditionObj[fieldName] = {
                    $gte: new Date(_fromDate),
                    $lte: new Date(_toDate)
                }
                break;
            }
            case 'before-days': {
                let beforeNDay = moment().add(-value, 'days');
                let _fromDate = moment(beforeNDay).startOf('day').format();
                let _toDate = moment(beforeNDay).endOf('day').format();

                conditionObj[fieldName] = {
                    $gte: new Date(_fromDate),
                    $lte: new Date(_toDate)
                }
                break;
            }
            case 'before-months': {
                let beforeNMonth = moment().add(-value, 'months');
                let _fromDate = moment(beforeNMonth).startOf('day').format();
                let _toDate = moment(beforeNMonth).endOf('day').format();

                conditionObj[fieldName] = {
                    $gte: new Date(_fromDate),
                    $lte: new Date(_toDate)
                }
                break;
            }
            case 'null': {
                if (type === 'date') {
                    conditionObj[fieldName] = {
                        $exists: false
                    };
                } else {
                    conditionObj[fieldName] = {
                        $eq: ''
                    };
                }
                break;
            }
            default:
                break;
        }

        return conditionObj;
    }

    /**
     * Lấy điều kiện lọc testing
     * @param {array} arrayFilter
     * @extends {BaseModel}
     * @returns {{ error: boolean, data?: object, message?: string }}
     */
    getListByFilterExcel({
        arrayFilter,
        arrayItemCustomerChoice,
        chooseCSV,
        nameOfParentColl
    }) {
        return new Promise(async resolve => {
            try {

                const listTestingByFilter = await TESTING_COLL.aggregate(arrayFilter)

                if (!listTestingByFilter) {
                    return resolve({
                        error: true,
                        message: "Không thể lấy danh sách orderv3"
                    });
                }
                const CHOOSE_CSV = 1;
                if (chooseCSV == CHOOSE_CSV) {
                    let nameFileExportCSV = nameOfParentColl + "-" + moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".csv";

                    let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', nameFileExportCSV);

                    let result = this.exportExcelCsv(pathWriteFile, listTestingByFilter, nameFileExportCSV, arrayItemCustomerChoice)
                    return resolve(result);
                } else {
                    let nameFileExportExcel = nameOfParentColl + "-" + moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".xlsx";

                    let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', nameFileExportExcel);

                    let result = await this.exportExcelDownload(pathWriteFile, listTestingByFilter, nameFileExportExcel, arrayItemCustomerChoice);

                    return resolve(result);
                }

            } catch (error) {
                console.error(error);
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    exportExcelCsv(pathWriteFile, lisData, fileNameRandom, arrayItemCustomerChoice) {
        let dataInsertCsv = [];
        lisData && lisData.length && lisData.map(item => {
            let objData = {};
            arrayItemCustomerChoice.map(elem => {
                let variable = elem.name.split('.');

                let value;
                if (variable.length > 1) {
                    let objDataOfVariable = item[variable[0]] ? item[variable[0]] : '';
                    if (objDataOfVariable) {
                        value = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                    }
                } else {
                    value = item[variable[0]] ? item[variable[0]] : '';
                }

                if (elem.type == 'date') { // TYPE: DATE
                    value = moment(value).format('L');
                }

                let nameCollChoice = '';
                if (elem.dataEnum && elem.dataEnum.length) { // TYPE: ISTATUS
                    nameCollChoice = ' ' + elem.nameCollChoice

                    elem.dataEnum.map(isStatus => {
                        if (isStatus.value == value) {
                            value = isStatus.title;
                        }
                    })
                }

                objData = {
                    ...objData,
                    [elem.note + nameCollChoice]: value
                }
            });

            objData = {
                ...objData,
                ['Ngày tạo']: moment(item.createAt).format('L')
            }

            dataInsertCsv = [
                ...dataInsertCsv,
                objData
            ]
        });

        let ws = fs.createWriteStream(pathWriteFile);
        fastcsv
            .write(dataInsertCsv, {
                headers: true
            })
            .on("finish", function() {
                console.log("Write to CSV successfully!");
            })
            .pipe(ws);

        return {
            error: false,
            data: "/files/upload_excel_temp/" + fileNameRandom,
            domain
        };
    }

    exportExcelDownload(pathWriteFile, listData, fileNameRandom, arrayItemCustomerChoice) {
        return new Promise(async resolve => {
            try {
                let dataInsertCsv = [];
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../../files/excel/Report.xlsx')))
                    .then(async workbook => {
                        arrayItemCustomerChoice.map((elem, index) => {
                            let nameCollChoice = '';
                            if (elem.dataEnum && elem.dataEnum.length) { // TYPE: ISTATUS
                                nameCollChoice = ' ' + elem.nameCollChoice
                            }
                            workbook.sheet("Report").row(1).cell(index + 1).value(elem.note + nameCollChoice);
                        });
                        workbook.sheet("Report").row(1).cell(arrayItemCustomerChoice.length + 1).value('Ngày tạo');

                        listData && listData.length && listData.map((item, index) => {
                            // let objData = {};
                            arrayItemCustomerChoice.map((elem, indexChoice) => {
                                let variable = elem.name.split('.');

                                let value;
                                if (variable.length > 1) {
                                    let objDataOfVariable = item[variable[0]] ? item[variable[0]] : '';
                                    if (objDataOfVariable) {
                                        value = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                    }
                                } else {
                                    value = item[variable[0]] ? item[variable[0]] : '';
                                }

                                if (elem.dataEnum && elem.dataEnum.length) { // TYPE: ISTATUS
                                    elem.dataEnum.map(isStatus => {
                                        if (isStatus.value == value) {
                                            value = isStatus.title;
                                        }
                                    })
                                }

                                if (elem.type == 'date') { // TYPE: DATE
                                    value = moment(value).format('HH:mm DD/MM/YYYY');
                                }
                                workbook.sheet("Report").row(index + 2).cell(indexChoice + 1).value(value);
                            });
                            workbook.sheet("Report").row(index + 2).cell(arrayItemCustomerChoice.length + 1).value(moment(item.createAt).format('HH:mm DD/MM/YYYY'));

                        });

                        // });
                        workbook.toFileAsync(pathWriteFile)
                            .then(_ => {
                                // Download file from server
                                return resolve({
                                    error: false,
                                    data: "/files/upload_excel_temp/" + fileNameRandom,
                                    path: fileNameRandom,
                                    domain
                                });
                            });
                    });

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Tải file import excel mẫu testing
     * @param {object} arrayItemCustomerChoice
     * @extends {BaseModel}
     * @returns {{ [key]: [value] }}
     */
    fileImportExcelPreview({
        arrayItemCustomerChoice
    }) {
        return new Promise(async resolve => {
            try {
                let fileNameRandom = moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".xlsx";
                let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', fileNameRandom);
                let condition = arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].condition; // BỘ LỌC && LOẠI IMPORT
                let {
                    listFieldPrimaryKey
                } = condition; // DANH SÁCH PRIMARY KEY

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../../files/excel/Report.xlsx')))
                    .then(async workbook => {
                        let index = 0;
                        arrayItemCustomerChoice.map((elem) => {
                            let nameCollChoice = '';
                            if (elem.dataEnum && elem.dataEnum.length) { // TYPE: ISTATUS
                                nameCollChoice = ' ' + elem.nameCollChoice
                            }
                            if (elem.dataDynamic && elem.dataDynamic.length) {
                                listFieldPrimaryKey = listFieldPrimaryKey.filter(key => key != elem.nameFieldRef); // LỌC PRIMARY KEY MÀ KHÔNG PHẢI REF

                                elem.dataDynamic.map(item => {
                                    workbook.sheet("Report").row(1).cell(index + 1).value(item);
                                    index++;
                                })
                            } else {
                                workbook.sheet("Report").row(1).cell(index + 1).value(elem.note + nameCollChoice);
                                index++;
                            }
                        });

                        if (isTrue(condition.checkDownloadDataOld)) { // KIỂM TRA CÓ ĐÍNH ĐÈM DỮ LIỆU CŨ THEO ĐIỀU KIỆN
                            let listItemImport = arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].listItemImport; // LIST FIELD ĐÃ ĐƯỢC CẤU HÌNH
                            let {
                                arrayFilter
                            } = this.getConditionArrayFilterExcel(listItemImport, condition.conditionDeleteImport.filter, condition.conditionDeleteImport.condition); // LẤY RA ARRAY ARREGATE

                            let groupByTesting = {};
                            listFieldPrimaryKey.map(key => {
                                groupByTesting = {
                                    ...groupByTesting,
                                    [key]: '$' + key
                                }
                            });

                            arrayFilter = [
                                ...arrayFilter,
                                {
                                    $group: {
                                        _id: {
                                            groupByTesting
                                        },
                                        listData: {
                                            $addToSet: "$$CURRENT"
                                        },
                                    }
                                }
                            ];

                            const listTestingByFilter = await TESTING_COLL.aggregate(arrayFilter);

                            listTestingByFilter && listTestingByFilter.length && listTestingByFilter.map((item, indexTesting) => {
                                let indexValue = 0;
                                arrayItemCustomerChoice.map((elem, indexChoice) => {
                                    let variable = elem.name.split('.');

                                    if (elem.dataDynamic && elem.dataDynamic.length) { // KIỂM TRA FIELD CÓ CHỌN DYNAMIC
                                        item.listData && item.listData.length && item.listData.map(value => { // ARRAY DATA DYNAMIC
                                            if (item.listData.length > elem.dataDynamic.length) { // KIỂM TRA ĐỘ DÀI CỦA DATA SO VỚI SỐ CỘT
                                                // TODO: XỬ LÝ NHIỀU DYNAMIC

                                            } else {
                                                elem.dataDynamic.map(dynamic => {
                                                    let valueOfField;
                                                    if (variable.length > 1) { // LẤY RA VALUE CỦA CỦA FIELD CHỌN
                                                        let objDataOfVariable = value[variable[0]] ? value[variable[0]] : '';
                                                        if (objDataOfVariable) {
                                                            valueOfField = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                                        }
                                                    } else {
                                                        valueOfField = value[variable[0]] ? value[variable[0]] : '';
                                                    }

                                                    if (valueOfField == dynamic) { // CHECK NẾU VALUE === CỘT
                                                        let valueImportDynamic = value[elem.variableChoice] ? value[elem.variableChoice] : '';

                                                        // INSERT DỮ LIỆU VÀO BẢNG VỚI FIELD ĐƯỢC CHỌN THEO DẠNG DYNAMIC
                                                        workbook.sheet("Report").row(indexTesting + 2).cell(indexValue + 1).value(valueImportDynamic);
                                                        indexValue++;
                                                    }
                                                })
                                            }
                                        })
                                    } else { // DẠNG STATIC
                                        let valueTesting;
                                        if (variable.length > 1) {
                                            let objDataOfVariable = item.listData[0][variable[0]] ? item.listData[0][variable[0]] : '';
                                            if (objDataOfVariable) {
                                                valueTesting = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                            }
                                        } else {
                                            valueTesting = item.listData[0][variable[0]] ? item.listData[0][variable[0]] : '';
                                        }

                                        workbook.sheet("Report").row(indexTesting + 2).cell(indexValue + 1).value(valueTesting);
                                        indexValue++;
                                    }
                                });
                            });
                        }

                        // });
                        workbook.toFileAsync(pathWriteFile)
                            .then(_ => {
                                // Download file from server
                                return resolve({
                                    error: false,
                                    data: "/files/upload_excel_temp/" + fileNameRandom,
                                    path: fileNameRandom,
                                    pathWriteFile,
                                    domain
                                });
                            });
                    });

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Upload File Excel Import Lưu Dữ Liệu testing
     * @param {object} arrayItemCustomerChoice
     * @extends {BaseModel}
     * @returns {{ [key]: [value] }}
     */
    importExcel({
        nameCollParent,
        arrayItemCustomerChoice,
        file,
    }) {
        return new Promise(async resolve => {
            try {

                XlsxPopulate.fromFileAsync(file.path)
                    .then(async workbook => {
                        let listData = [];
                        let index = 2;
                        let condition = arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].condition;

                        const client = await MongoClient.connect(URL_DATABASE);
                        const db = client.db(NAME_DATABASE)

                        for (; true;) {
                            if (arrayItemCustomerChoice && arrayItemCustomerChoice.length) {
                                let conditionObj = {};

                                let totalLength = 0;
                                arrayItemCustomerChoice.map((item, index) => {
                                    if (item.dataDynamic && item.dataDynamic.length) {
                                        totalLength += item.dataDynamic.length;
                                    } else {
                                        totalLength++;
                                    }
                                });

                                let indexOfListField = 0;
                                let checkIsRequire = false;
                                let arrayConditionObjDynamic = [];

                                for (let i = 0; i < totalLength; i++) {
                                    if (arrayItemCustomerChoice[indexOfListField].dataDynamic && arrayItemCustomerChoice[indexOfListField].dataDynamic.length) {
                                        let indexOfDynamic = 1;
                                        for (let valueDynamic of arrayItemCustomerChoice[indexOfListField].dataDynamic) {
                                            let letter = colName(i);
                                            let indexOfCeil = letter.toUpperCase() + index;

                                            let variable = workbook.sheet(0).cell(indexOfCeil).value();
                                            if (variable) {

                                                let collName = pluralize.plural(arrayItemCustomerChoice[indexOfListField].ref);
                                                let checkPluralColl = collName[collName.length - 1];

                                                if (checkPluralColl.toLowerCase() != 's') {
                                                    collName += 's';
                                                }

                                                const docs = await db.collection(collName).findOne({
                                                    [arrayItemCustomerChoice[indexOfListField].variable]: valueDynamic.trim()
                                                });

                                                let conditionOfOneValueDynamic = {
                                                    [arrayItemCustomerChoice[indexOfListField].variableChoice]: variable
                                                }
                                                if (docs) {
                                                    conditionOfOneValueDynamic = {
                                                        ...conditionOfOneValueDynamic,
                                                        [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id,
                                                    }
                                                }

                                                arrayConditionObjDynamic = [
                                                    ...arrayConditionObjDynamic,
                                                    conditionOfOneValueDynamic
                                                ];
                                            }

                                            if (indexOfDynamic < arrayItemCustomerChoice[indexOfListField].dataDynamic.length) {
                                                i++;
                                            }
                                            indexOfDynamic++;
                                        }
                                    } else {
                                        let letter = colName(i);
                                        let indexOfCeil = letter.toUpperCase() + index;
                                        let variable = workbook.sheet(0).cell(indexOfCeil).value();
                                        if (arrayItemCustomerChoice[indexOfListField].isRequire && !variable) {
                                            checkIsRequire = true;
                                            break;
                                        }
                                        if (arrayItemCustomerChoice[indexOfListField].ref && arrayItemCustomerChoice[indexOfListField].ref != nameCollParent) {
                                            if (arrayItemCustomerChoice[indexOfListField].isRequire) {
                                                let collName = pluralize.plural(arrayItemCustomerChoice[indexOfListField].ref);
                                                let checkPluralColl = collName[collName.length - 1];

                                                if (checkPluralColl.toLowerCase() != 's') {
                                                    collName += 's';
                                                }

                                                const docs = await db.collection(collName).findOne({
                                                    [arrayItemCustomerChoice[indexOfListField].variable]: variable.trim()
                                                })
                                                // .sort({
                                                //     _id: -1
                                                // })
                                                // .limit(100)
                                                // .toArray();
                                                if (docs) {
                                                    conditionObj = {
                                                        ...conditionObj,
                                                        [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id
                                                    };
                                                }
                                            }
                                        } else {
                                            conditionObj = {
                                                ...conditionObj,
                                                [arrayItemCustomerChoice[indexOfListField].name]: variable
                                            };
                                        }
                                    }

                                    indexOfListField++;
                                }
                                if (checkIsRequire) {
                                    break;
                                }

                                conditionObj = {
                                    ...conditionObj,
                                    createAt: new Date(),
                                    modifyAt: new Date(),
                                }

                                let arrayCondditionObj = []
                                if (arrayConditionObjDynamic && arrayConditionObjDynamic.length) {
                                    arrayConditionObjDynamic.map(item => {
                                        arrayCondditionObj = [
                                            ...arrayCondditionObj,
                                            {
                                                ...conditionObj,
                                                ...item
                                            }
                                        ]
                                    });
                                } else {
                                    arrayCondditionObj = [
                                        ...arrayCondditionObj,
                                        conditionObj
                                    ]
                                }
                                listData = [
                                    ...listData,
                                    ...arrayCondditionObj
                                ];

                                index++;
                            }
                        }

                        await fs.unlinkSync(file.path);

                        if (listData.length) {
                            await this.changeDataImport({
                                condition,
                                listTesting: listData
                            });
                        } else {
                            return resolve({
                                error: true,
                                message: 'Import thất bại'
                            });
                        }

                        return resolve({
                            error: false,
                            message: 'Import thành công'
                        });
                    });

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lưu Dữ Liệu Theo Lựa Chọn testing
     * @param {object} listTesting
     * @param {object} condition
     * @extends {BaseModel}
     * @returns {{ [key]: [value] }}
     */
    changeDataImport({
        condition,
        listTesting
    }) {
        return new Promise(async resolve => {
            try {
                if (isTrue(condition.delete)) { // XÓA DATA CŨ
                    if (isTrue(condition.deleteAll)) { // XÓA TẤT CẢ DỮ LIỆU
                        console.log("====================XÓA TẤT CẢ DỮ LIỆU====================");
                        await TESTING_COLL.deleteMany({});
                        let listDataAfterInsert = await TESTING_COLL.insertMany(listTesting);
                        return resolve({
                            error: false,
                            message: 'Insert success',
                            data: listDataAfterInsert
                        });
                    } else { // XÓA VỚI ĐIỀU KIỆN
                        console.log("====================XÓA VỚI ĐIỀU KIỆN====================");

                        /**
                         * ===========================================================================
                         * =========================XÓA DỮ LIỆU VỚI ĐIỀU KIỆN=========================
                         * ===========================================================================
                         */
                        let {
                            filter,
                            condition: conditionMultiple,
                        } = condition.conditionDeleteImport;

                        if (!filter || !filter.length) {
                            return resolve({
                                error: true,
                                message: 'Filter do not exist'
                            });
                        }

                        let conditionObj = {
                            state: 1,
                            $or: []
                        };

                        if (filter && filter.length) {
                            if (filter.length > 1) {

                                filter.map(filterObj => {
                                    if (filterObj.type === 'ref') {
                                        const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);

                                        if (conditionMultiple === 'OR') {
                                            conditionObj.$or.push(conditionFieldRef);
                                        } else {
                                            conditionObj = {
                                                ...conditionObj,
                                                ...conditionFieldRef
                                            };
                                        }
                                    } else {
                                        const conditionByFilter = this.getConditionObj(filterObj);

                                        if (conditionMultiple === 'OR') {
                                            conditionObj.$or.push(conditionByFilter);
                                        } else {
                                            conditionObj = {
                                                ...conditionObj,
                                                ...conditionByFilter
                                            };
                                        }
                                    }
                                });

                            } else {
                                let {
                                    type,
                                    ref,
                                    fieldRefName
                                } = filter[0];

                                if (type === 'ref') {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...this.getConditionObj(ref, fieldRefName)
                                    };
                                } else {
                                    conditionObj = {
                                        ...conditionObj,
                                        ...this.getConditionObj(filter[0])
                                    };
                                }
                            }
                        }

                        if (conditionObj.$or && !conditionObj.$or.length) {
                            delete conditionObj.$or;
                        }

                        let listAfterDelete = await TESTING_COLL.deleteMany({
                            ...conditionObj
                        });
                        /**
                         * ===============================================================================
                         * =========================END XÓA DỮ LIỆU VỚI ĐIỀU KIỆN=========================
                         * ===============================================================================
                         */

                        if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                            for (let item of listTesting) {
                                let listConditionFindOneUpdate = {};
                                let {
                                    listFieldPrimaryKey
                                } = condition;
                                listFieldPrimaryKey.map(elem => {
                                    listConditionFindOneUpdate = {
                                        ...listConditionFindOneUpdate,
                                        [elem]: item[elem]
                                    }
                                });

                                listConditionFindOneUpdate = {
                                    ...listConditionFindOneUpdate,
                                    state: 1
                                }

                                let checkExist = await TESTING_COLL.findOneAndUpdate(listConditionFindOneUpdate, {
                                    $set: item
                                }, {
                                    upsert: true
                                });
                            }
                            return resolve({
                                error: false,
                                message: 'Insert success'
                            });

                        } else { // INSERT CÁI MỚI
                            console.log("====================INSERT CÁI MỚI 2====================");
                            let listDataAfterInsert = await TESTING_COLL.insertMany(listTesting);
                            return resolve({
                                error: false,
                                message: 'Insert success',
                                data: listDataAfterInsert
                            });
                        }
                    }
                } else { // KHÔNG XÓA DATA CŨ
                    if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                        console.log("====================KIỂM TRA TỒN TẠI VÀ UPDATE====================");
                        for (let item of listTesting) {
                            let listConditionFindOneUpdate = {};
                            let {
                                listFieldPrimaryKey
                            } = condition;
                            listFieldPrimaryKey.map(elem => {
                                listConditionFindOneUpdate = {
                                    ...listConditionFindOneUpdate,
                                    [elem]: item[elem]
                                }
                            });

                            listConditionFindOneUpdate = {
                                ...listConditionFindOneUpdate,
                                state: 1
                            }

                            let checkExist = await TESTING_COLL.findOneAndUpdate(listConditionFindOneUpdate, {
                                $set: item
                            }, {
                                upsert: true
                            });
                        }
                        return resolve({
                            error: false,
                            message: 'Insert success'
                        });
                    } else { // INSERT CÁI MỚI
                        console.log("====================INSERT CÁI MỚI====================");
                        let listDataAfterInsert = await TESTING_COLL.insertMany(listTesting);
                        return resolve({
                            error: false,
                            message: 'Insert success',
                            data: listDataAfterInsert
                        });
                    }
                }

            } catch (error) {
                return resolve({
                    error: true,
                    message: error.message
                });
            }
        })
    }

    /**
     * Lấy điều kiện lọc testing
     * @param {object} filter
     * @extends {BaseModel}
     * @returns {{ [key]: [value] }}
     */
    getConditionArrayFilterExcel(listItemExport, filter, condition, objFilterStatic, field, dir, keyword, arrayItemChecked) {
        let arrPopulate = [];
        let refParent = '';
        let arrayItemCustomerChoice = [];
        let arrayFieldIDChoice = [];

        let conditionObj = {
            state: 1,
            $or: []
        };

        listItemExport.map((item, index) => {
            arrayFieldIDChoice = [
                ...arrayFieldIDChoice,
                item.fieldID
            ];

            let nameFieldRef = '';
            listItemExport.map(element => {
                if (element.ref == item.coll) {
                    nameFieldRef = element.name;
                }
            });
            if (!item.refFrom) {
                refParent = item.coll;
                // select += item.name + " ";
                if (!item.ref) { // KHÔNG THÊM NHỮNG FIELD REF
                    arrayItemCustomerChoice = [
                        ...arrayItemCustomerChoice,
                        {
                            fieldID: item.fieldID,
                            name: item.name,
                            note: item.note,
                            type: item.typeVar,
                            ref: item.coll,
                            variable: item.name,
                            nameFieldRef,
                            dataEnum: item.dataEnum,
                            isRequire: item.isRequire,
                            dataDynamic: item.dataDynamic ? item.dataDynamic : [],
                            variableChoice: item.variableChoice,
                            nameCollChoice: item.nameCollChoice,
                        }
                    ];
                }
            } else {
                if (!arrPopulate.length) {
                    arrPopulate = [{
                        name: nameFieldRef,
                        coll: item.coll,
                        select: item.name + " ",
                        refFrom: item.refFrom,
                    }];
                    if (!item.ref) { // KHÔNG THÊM NHỮNG FIELD REF
                        arrayItemCustomerChoice = [
                            ...arrayItemCustomerChoice,
                            {
                                fieldID: item.fieldID,
                                name: nameFieldRef + "." + item.name,
                                note: item.note,
                                type: item.typeVar,
                                ref: item.coll,
                                variable: item.name,
                                nameFieldRef,
                                dataEnum: item.dataEnum,
                                isRequire: item.isRequire,
                                dataDynamic: item.dataDynamic ? item.dataDynamic : [],
                                variableChoice: item.variableChoice,
                                nameCollChoice: item.nameCollChoice,
                            }
                        ];
                    }
                } else {
                    if (item.refFrom == refParent) { // POPULATE CẤP 2
                        let mark = false;
                        arrPopulate.map((elem, indexV2) => {
                            if (elem.coll == item.coll) { // KIỂM TRA XEM POPULATE CẤP 3 ĐÃ ĐƯỢC THÊM VẢO MẢNG
                                mark = true,
                                    arrPopulate[indexV2].select += item.name + " ";
                            }
                        });
                        if (!mark) { // CHƯA ĐƯỢC THÊM THÌ THÊM VÀO
                            arrPopulate = [
                                ...arrPopulate,
                                {
                                    name: nameFieldRef,
                                    coll: item.coll,
                                    select: item.name + " ",
                                    refFrom: item.refFrom,
                                }
                            ];
                        }
                        if (!item.ref) { // KHÔNG THÊM NHỮNG FIELD REF
                            arrayItemCustomerChoice = [
                                ...arrayItemCustomerChoice,
                                {
                                    fieldID: item.fieldID,
                                    name: nameFieldRef + "." + item.name,
                                    note: item.note,
                                    type: item.typeVar,
                                    ref: item.coll,
                                    variable: item.name,
                                    nameFieldRef,
                                    dataEnum: item.dataEnum,
                                    isRequire: item.isRequire,
                                    dataDynamic: item.dataDynamic ? item.dataDynamic : [],
                                    variableChoice: item.variableChoice,
                                    nameCollChoice: item.nameCollChoice,
                                }
                            ];
                        }
                    } else { // POPULATE CẤP 3 TRỞ LÊN
                        if (!item.ref) { // KHÔNG THÊM NHỮNG FIELD REF
                            arrayItemCustomerChoice = [
                                ...arrayItemCustomerChoice,
                                {
                                    fieldID: item.fieldID,
                                    name: nameFieldRef + "." + item.name,
                                    note: item.note,
                                    type: item.typeVar,
                                    dataEnum: item.dataEnum,
                                    ref: item.coll,
                                    variable: item.name,
                                    nameFieldRef,
                                    isRequire: item.isRequire,
                                    dataDynamic: item.dataDynamic ? item.dataDynamic : [],
                                    variableChoice: item.variableChoice,
                                    nameCollChoice: item.nameCollChoice,
                                }
                            ];
                        }
                        arrPopulate.map((elem, indexV3) => {
                            if (elem.coll == item.refFrom) { // KIỂM TRA XEM POPULATE CẤP 3 ĐÃ ĐƯỢC THÊM VẢO MẢNG
                                if (!arrPopulate[indexV3].populate || !arrPopulate[indexV3].populate.length) {
                                    arrPopulate[indexV3].populate = [{
                                        name: nameFieldRef,
                                        coll: item.coll,
                                        select: item.name + " ",
                                        refFrom: item.refFrom,
                                    }]
                                } else {
                                    let markPopulate = false;
                                    arrPopulate[indexV3].populate.map(populate => {
                                        if (!populate.name.includes(item.coll)) {
                                            markPopulate = true;
                                            arrPopulate[indexV3].populate = [
                                                ...arrPopulate[indexV3].populate,
                                                {
                                                    name: nameFieldRef,
                                                    coll: item.coll,
                                                    select: item.name + " ",
                                                    refFrom: item.refFrom,
                                                }
                                            ]
                                        }
                                    })
                                    if (!markPopulate) {
                                        arrPopulate[indexV3].populate.select += item.name + " ";
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });

        if (keyword) {
            let key = keyword.split(" ");
            key = '.*' + key.join(".*") + '.*';

            conditionObj.$or = [{
                name: {
                    $regex: key,
                    $options: 'i'
                }
            }, {
                code: {
                    $regex: key,
                    $options: 'i'
                }
            }]
        }

        if (filter && filter.length) {
            if (filter.length > 1) {

                filter.map(filterObj => {
                    if (filterObj.type === 'ref') {
                        const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);

                        if (condition === 'OR') {
                            conditionObj.$or.push(conditionFieldRef);
                        } else {
                            conditionObj = {
                                ...conditionObj,
                                ...conditionFieldRef
                            };
                        }
                    } else {
                        const conditionByFilter = this.getConditionObj(filterObj);

                        if (condition === 'OR') {
                            conditionObj.$or.push(conditionByFilter);
                        } else {
                            conditionObj = {
                                ...conditionObj,
                                ...conditionByFilter
                            };
                        }
                    }
                });

            } else {
                let {
                    type,
                    ref,
                    fieldRefName
                } = filter[0];

                if (type === 'ref') {
                    conditionObj = {
                        ...conditionObj,
                        ...this.getConditionObj(ref, fieldRefName)
                    };
                } else {
                    conditionObj = {
                        ...conditionObj,
                        ...this.getConditionObj(filter[0])
                    };
                }
            }
        }

        if (conditionObj.$or && !conditionObj.$or.length) {
            delete conditionObj.$or;
        }



        if (arrayItemChecked && arrayItemChecked.length) {
            conditionObj = {
                ...conditionObj,
                _id: {
                    $in: [...arrayItemChecked.map(item => ObjectID(item))]
                }
            }
        }

        let arrayFilter = [{
            $match: {
                ...conditionObj
            }
        }];

        if (arrPopulate.length) {
            arrPopulate.map(item => {
                let collName = pluralize.plural(item.coll);
                let checkPluralColl = collName[collName.length - 1];

                if (checkPluralColl.toLowerCase() != 's') {
                    collName += 's';
                }

                let lookup = [{
                        $lookup: {
                            from: collName,
                            localField: item.name,
                            foreignField: '_id',
                            as: item.name
                        },
                    },
                    {
                        $unwind: {
                            path: "$" + item.name,
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ];
                if (item.populate && item.populate.length) {
                    item.populate.map(populate => {
                        let collNamePopulate = pluralize.plural(populate.coll);
                        let checkPluralColl = collNamePopulate[collNamePopulate.length - 1];

                        if (checkPluralColl.toLowerCase() != 's') {
                            collNamePopulate += 's';
                        }

                        lookup = [
                            ...lookup,
                            {
                                $lookup: {
                                    from: collNamePopulate,
                                    localField: item.name + "." + populate.name,
                                    foreignField: '_id',
                                    as: populate.name
                                },
                            },
                            {
                                $unwind: {
                                    path: "$" + populate.name,
                                    preserveNullAndEmptyArrays: true
                                }
                            }
                        ]
                    })
                }
                arrayFilter = [
                    ...arrayFilter,
                    ...lookup
                ]
            });
        }
        let sort = {
            modifyAt: -1
        };

        if (field && dir) {
            if (dir == 'asc') {
                sort = {
                    [field]: 1
                }
            } else {
                sort = {
                    [field]: -1
                }
            }
        }

        arrayFilter = [
            ...arrayFilter,
            {
                $sort: sort
            }
        ]



        return {
            arrayFilter,
            arrayItemCustomerChoice,
            refParent,
            arrayFieldIDChoice
        };
    }

}

module.exports.MODEL = new Model;