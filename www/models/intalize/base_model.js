"use strict";

const timeUtils = require('../../utils/time_utils');
const PROMISE = require('bluebird');
const OBJECT_ID = require('mongoose').Types.ObjectId;

class BaseModel {
    /**
     * @return {number}
     */
    static get FIND_ONE() {
        return 1
    }

    /**
     * @return {number}
     */
    static get FIND_MANY() {
        return 2
    }

    /**
     * @return {number}
     */
    FIND_ONE() {
        return 1
    }

    /**
     * @return {number}
     */
    FIND_MANY() {
        return 2
    }

    constructor(collection) {
        this.coll = collection;
    }

    updateById(id, updatedata) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            updatedata.modifyAt = timeUtils.getCurrentTime();
            coll.update({_id: OBJECT_ID(id)}, updatedata, function (error) {
                return resolve(error);
            })
        });
    }

    insertData(data) {
        return new PROMISE(async (resolve) =>  {
            data.modifyAt = timeUtils.getCurrentTime();
            data.createAt = timeUtils.getCurrentTime();

            (new this.coll(data)).save(function (error, result) {
                console.error({ 'insertData error': error });
                return resolve(result, error);
            });
        });
    }

    updateWhereClause(condition, updatedata) {
        return new PROMISE(async resolve => {
            updatedata.modifyAt = timeUtils.getCurrentTime();

            let infoAfterUpdate = await this.coll.findOneAndUpdate(condition, updatedata, { new: true });
            resolve(infoAfterUpdate);
        });
    }

    getAllData() {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.find({}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    getDocumentLatestUpdate() {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOne({}).sort({modifyAt: -1}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    getDocumentLatestUpdateWhere(condition) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOne(condition).sort({modifyAt: -1}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    getDocumentOldUpdate() {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOne({}).sort({modifyAt: 1}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    getDocumentLatestCreate() {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOne({}).sort({createAt: -1}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    getDocumentOldCreate() {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOne({}).sort({createAt: 1}).lean().exec().then(function (result) {
                return resolve(result);
            })
        });
    }

    countDataWhere(condition) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.count(condition, function (error, count) {
                return resolve(count);
            })
        });
    }


    getDataById(id) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.find({_id: OBJECT_ID(id)}).lean().exec().then(function (result) {
                if (result === null) {
                    return resolve(null);
                } else {
                    return resolve(result[0]);
                }
            })
        });
    }

    getDataWhere(whereClause, findType, sort = null, limit = null) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            if (BaseModel.FIND_ONE == findType) {
                if (sort != null) {
                    coll.findOne(whereClause).sort(sort).lean().exec().then(function (result) {
                        return resolve(result);
                    })
                } else {
                    coll.findOne(whereClause).sort(sort).lean().exec().then(function (result) {
                        return resolve(result);
                    })
                }

            } else if (BaseModel.FIND_MANY == findType) {
                if (sort != null) {
                    if (limit != null) {
                        coll.find(whereClause).sort(sort).limit(limit).lean().exec().then(function (result) {
                            return resolve(result);
                        })
                    } else {
                        coll.find(whereClause).sort(sort).lean().exec().then(function (result) {
                            return resolve(result);
                        })
                    }

                } else {
                    if (limit != null) {
                        coll.find(whereClause).sort(sort).limit(limit).lean().exec().then(function (result) {
                            return resolve(result);
                        })
                    } else {
                        coll.find(whereClause).sort(sort).lean().exec().then(function (result) {
                            return resolve(result);
                        })
                    }
                }
            }
        });
    }

    removeManyWhere(condition) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.deleteMany(condition).then(function (result) {
                resolve(result);
            })
        });
    }

    removeDataWhere(condition) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.findOneAndDelete(condition).then(function (result) {
                resolve(result);
            })
        });
    }

    removeDataById(id) {
        let coll = this.coll;
        return new PROMISE(function (resolve) {
            coll.remove({_id: OBJECT_ID(id)}, function (error) {
                return resolve();
            })
        }).catch(function () {
            return new PROMISE(function (resolve) {
                return resolve(null);
            })
        });
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.insertMany
     */
    insertMany(docs, options = {}){
        return this.coll.insertMany(docs, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.find
     */
    find(conditions, projection = {}){
        return this.coll.find(conditions, projection);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findById
     */
    findById(id, projection = {}){
        return this.coll.findById(id, projection);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findOne
     */
    findOne(conditions, projection = {}){
        return this.coll.findOne(conditions, projection);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findByIdAndDelete
     */
    findByIdAndDelete(id){
        return this.coll.findByIdAndDelete(id);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findOneAndDelete
     */
    findOneAndDelete(conditions, options = {}){
        return this.coll.findOneAndDelete(conditions, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.deleteMany
     */
    deleteMany(conditions, options = {}){
        return this.coll.deleteMany(conditions, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
     */
    findByIdAndUpdate(id, dataUpdate, options = { new: true }){
        dataUpdate.modifyAt = timeUtils.getCurrentTime();
        return this.coll.findByIdAndUpdate(id, dataUpdate, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.findOneAndUpdate
     */
    findOneAndUpdate(conditions, dataUpdate, options = { new: true }){
        dataUpdate.modifyAt = timeUtils.getCurrentTime();
        return this.coll.findOneAndUpdate(conditions, dataUpdate, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.updateMany
     */
    updateMany(conditions, dataUpdate, options = { new: true }){
        dataUpdate.modifyAt = timeUtils.getCurrentTime();
        return this.coll.updateMany(conditions, dataUpdate, options);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.populate
     */
    countDocuments(conditions = {}){
        return this.coll.countDocuments(conditions);
    }

    /**
     * @docs https://mongoosejs.com/docs/api.html#model_Model.populate
     */
    populate(docs, options = {}){
        return this.coll.populate(docs, options);
    }

}

module.exports = BaseModel;