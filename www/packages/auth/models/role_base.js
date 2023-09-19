"use strict";

/**
 * TOOLS
 */
const { checkObjectIDs }            = require("../../../utils/utils");
const { getCurrentTime }            = require("../../../utils/time_utils");

/**
 * BASE
 */
const BaseModel 					= require('../../../models/intalize/base_model');

/**
 * COLLECTIONS
 */
const ROLE_BASE__COLL				= require('../databases/role_base-coll');
const ROLE_PERMISSION__COLL			= require('../databases/role_permission-coll');


class Model extends BaseModel {
    constructor() {
        super(ROLE_BASE__COLL);
    }

	insert({ name, description }) {
        return new Promise(async resolve => {
            try {
				if(!name || !description)
					return resolve({ error: true, code: 400, message: 'Bạn cần nhập đầy đủ tên và mô tả' })

                let infoAfterInsert = await this.insertData({ name, description });

                if(!infoAfterInsert)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi tạo role' });

                return resolve({ error: false, code: 200, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	update({ roleID, name, description }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(roleID))
					return resolve({ error: true, code: 400, message: 'ID role không hợp lệ' });

				if(!name || !description)
					return resolve({ error: true, code: 400, message: 'Bạn cần nhập đầy đủ tên và mô tả' })

                let infoAfterUpdate = await ROLE_BASE__COLL.findByIdAndUpdate(roleID, { name, description });

                if(!infoAfterUpdate)
                    return resolve({ error: true, code: 403, message: 'Có lỗi trong khi cập nhật role' });

                return resolve({ error: false, code: 200, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	getList({}) {
        return new Promise(async resolve => {
            try {
                let listRoles = await ROLE_BASE__COLL
					.find({})
					.sort({ createAt: -1 })
					.lean();

                if(!listRoles)
                    return resolve({ error: true, code: 403, message: 'Không thể lấy danh sách Roles' });

                return resolve({ error: false, code: 200, data: listRoles });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	getListPermissionByRole({ role }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(role))
					return resolve({ error: true, code: 400, message: 'ID role không hợp lệ' });

                let listPermissionByRole = await ROLE_PERMISSION__COLL
					.find({ role })
					.populate({
						path: 'scope',
						populate: 'api'
					})
                    .sort({ _id: 1 })
					.lean();

                if(!listPermissionByRole)
                    return resolve({ error: true, code: 403, message: 'Không thể lấy danh sách permission' });

                return resolve({ error: false, code: 200, data: listPermissionByRole });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

	insertPermission({ roleID, scopes }) {
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(roleID))
					return resolve({ error: true, code: 400, message: 'ID role không hợp lệ' });

				if(!scopes || !scopes.length)
					return resolve({ error: true, code: 400, message: 'Bạn cần chọn scope' });

				let infoAfterInsertPromise = scopes.map(async scope => {
					const checkExists = await ROLE_PERMISSION__COLL.findOne({ role: roleID, scope }).lean();

					if(!checkExists){
						ROLE_PERMISSION__COLL.create({
							role: roleID,
							scope,
							createAt: getCurrentTime()
						});
					}
				});

                await Promise.all(infoAfterInsertPromise);

                return resolve({ error: false, code: 200 });
            } catch (error) {
                return resolve({ error: true, code: 500, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
