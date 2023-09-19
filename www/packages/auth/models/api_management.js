"use strict";

/**
 * TOOLS
 */
const { checkObjectIDs }            = require("../../../utils/utils");
const { getCurrentTime }            = require("../../../utils/time_utils");
const { capitalize } 				= require('../../../utils/string_utils');

/**
 * BASE
 */
const BaseModel 					= require('../../../models/intalize/base_model');

/**
 * COLLECTIONS
 */
const API_IDENTIFIER__COLL			= require('../databases/api_identifier-coll');
const API_SCOPE__COLL				= require('../databases/api_scope-coll');
const ROLL_PERMISSION__COLL			= require('../databases/role_permission-coll');
const USER_COLL						= require('../../user/databases/user-coll');


class Model extends BaseModel {
    constructor() {
        super(API_IDENTIFIER__COLL);
    }

	insert({ name, endpoint }) {
        return new Promise(async resolve => {
            try {
				if(!name || !endpoint)
					return resolve({ error: true, code: 400, message: 'Bạn cần nhập đầy đủ tên và api định danh' });

                let infoAfterInsert = await this.insertData({ name, endpoint });

                if(!infoAfterInsert)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi tạo api định danh' });

				let nameModule 		= name.split('-');
				let nameDescription	= '';

				if(nameModule.length > 2){
					nameModule.shift();
					nameDescription = capitalize(nameModule.join(' '));
					nameModule 		= nameModule.join('_').toLowerCase();
				}

				if(nameModule.length === 2){
					nameDescription = capitalize(nameModule[1]);
					nameModule 		= nameModule[1].toLowerCase();
				}

				let defaultScopes = [
					{ name: `create:${nameModule}`, description: `Create ${nameDescription}` },
					{ name: `update:${nameModule}`, description: `Update ${nameDescription}` },
					{ name: `delete:${nameModule}`, description: `Delete ${nameDescription}` },
					{ name: `read:info_${nameModule}`, description: `Get Info ${nameDescription}` },
					{ name: `read:list_${nameModule}`, description: `Get List ${nameDescription}` },
				];

				defaultScopes = defaultScopes.map(async scope => API_SCOPE__COLL.create({
					name: scope.name,
					description: scope.description,
					api: infoAfterInsert._id
				}))

				defaultScopes = await Promise.all(defaultScopes);

                return resolve({ error: false, code: 200, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	update({ apiID, name, status }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(apiID))
					return resolve({ error: true, code: 400, message: 'ID api không hợp lệ' });

				if(!name)
					return resolve({ error: true, code: 400, message: 'Bạn cần nhập đầy đủ tên cho api định danh' })

				const dataUpdate = { name };
				status && (dataUpdate.status = status);

                let infoAfterUpdate = await API_IDENTIFIER__COLL.findByIdAndUpdate(apiID, dataUpdate);

                if(!infoAfterUpdate)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi cập nhật api' });

                return resolve({ error: false, code: 200, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	deleteApi({ apiID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(apiID))
					return resolve({ error: true, code: 400, message: 'ID api không hợp lệ' });

                let infoAfterDelete = await API_IDENTIFIER__COLL.findByIdAndDelete(apiID);

                if(!infoAfterDelete)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi xoá api' });

				let listScopeByID = await API_SCOPE__COLL.find({ api: apiID }).select('_id').lean();
				listScopeByID = listScopeByID.map(scope => scope._id);

				await ROLL_PERMISSION__COLL.deleteMany({ scope: { $in: listScopeByID } });
				await API_SCOPE__COLL.deleteMany({ api: apiID });
				await USER_COLL.updateMany({}, {
					$pullAll: { permissions: listScopeByID }
				})

                return resolve({ error: false, code: 200, data: infoAfterDelete });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	getList({}) {
        return new Promise(async resolve => {
            try {
                let listApi = await API_IDENTIFIER__COLL
					.find({})
					.sort({ createAt: -1 })
					.lean();

                if(!listApi)
                    return resolve({ error: true, code: 403, message: 'Không thể lấy danh sách API' });

                return resolve({ error: false, code: 200, data: listApi });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

    getInfoByCondition(condition) {
        return new Promise(async resolve => {
            try {
                let infoAPI = await API_IDENTIFIER__COLL.findOne(condition).lean();

                if(!infoAPI)
                    return resolve({ error: true, code: 403, message: 'Không thể lấy thông tin API' });

                return resolve({ error: false, code: 200, data: infoAPI });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	insertScope({ name, description, apiID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(apiID))
					return resolve({ error: true, code: 400, message: 'ID api không hợp lệ' });

				if(!name || !description)
					return resolve({ error: true, code: 400, message: 'Bạn cần nhập đầy đủ tên và mô tả cho scope' });

                let infoAfterInsert = await API_SCOPE__COLL.create({
					api: apiID,
					name,
					description,
					createAt: getCurrentTime()
				});

                if(!infoAfterInsert)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi tạo scope' });

                return resolve({ error: false, code: 200, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	deleteScope({ scopeID }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(scopeID))
					return resolve({ error: true, code: 400, message: 'ID scope không hợp lệ' });

                let infoAfterDelete = await API_SCOPE__COLL.findByIdAndDelete(scopeID);

                if(!infoAfterDelete)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi xoá scope' });

				await ROLL_PERMISSION__COLL.deleteMany({ scope: scopeID });
				await USER_COLL.updateMany({}, {
					$pull: { permissions: scopeID }
				})

                return resolve({ error: false, code: 200, data: infoAfterDelete });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	getListScopeByApi({ api }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(api))
					return resolve({ error: true, code: 400, message: 'ID api không hợp lệ' });

                let listScopeByApi = await API_SCOPE__COLL
					.find({ api })
					.lean();

                if(!listScopeByApi)
                    return resolve({ error: true, code: 403, message: 'Không thể lấy danh sách scope' });

                return resolve({ error: false, code: 200, data: listScopeByApi });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
