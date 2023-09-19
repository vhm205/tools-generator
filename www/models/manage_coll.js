"use strict";

const ObjectID                  = require('mongoose').Types.ObjectId;
const BaseModel                 = require('./intalize/base_model');
const { 
    renderOptionFilter
} = require('../utils/utils');

const { isTrue }                = require('../tools/module/check');

const MANAGE_MODULE_COLL        = require('../database/manage_module-coll');
const MANAGE_COLLECTION_COLL    = require('../database/manage_coll-coll');
const TYPE_COLLECTION_COLL      = require('../database/type_coll-coll');
const CUSTOM_API_COLL           = require('../database/custom_api-coll');
const HISTORY_EXPORT_COLL       = require('../database/history_export_coll-coll');
const HISTORY_IMPORT_COLL       = require('../database/history_import_coll-coll');

class Model extends BaseModel {

    constructor() {
        super(MANAGE_COLLECTION_COLL);
    }

    insertCollection({ name, description, folderName, icon, isApiAddress, isSystemConfig }) {
        return new Promise(async (resolve) => {
            try {
                if(!name)
                    return resolve({ error: true, message: 'name_param_required' });

                let checkExists = await MANAGE_COLLECTION_COLL.findOne({ name: name.trim() });
                if(checkExists) {
                    await MANAGE_COLLECTION_COLL.findByIdAndUpdate(checkExists._id, {
                        description, folderName, icon, isApiAddress
                    })

                    await MANAGE_MODULE_COLL.findOneAndUpdate({
                        name: checkExists.folderName.trim()
                    }, {
                        $set: {
                            name: folderName
                        }
                    });

                    return resolve({ error: false, data: checkExists });
                }

                let infoAfterInsert = await this.insertData({ 
                    name, description, folderName, icon, isApiAddress, isSystemConfig
                });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Can't insert collection" });

                const infoModule = await MANAGE_MODULE_COLL.findOne({ name: folderName.trim() });

                if(infoModule) {
                    await MANAGE_MODULE_COLL.findByIdAndUpdate(infoModule._id, {
                        $addToSet: {
                            models: infoAfterInsert._id
                        }
                    });
                } else {
                    await MANAGE_MODULE_COLL.create({
                        name: folderName,
                        models: [infoAfterInsert._id]
                    })
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    insertFieldCollection({
        coll, name, type, note, isUnique, isRequire, isTrim, isInsert, isUpdate, isSlug, isCurrency, isDefault, 
        fileType, dateType, defaultValue, formatDate, ref, isEnum, dataEnum, isShowList, isOrder, isLink, isTinyMCE, isTextarea, 
        isBold, isItalic, isImage, isStatus, typeImage, typeUpload, refShow, followBy, widthDatatable, placeholder, tableSub, isPrimary,
        isExport, isImport, isBigData, isInsertUpdateFrom, dataInsertUpdateFrom, isApiAddress
    }){
        return new Promise(async (resolve) => {
            try {
                if(!coll || !ObjectID.isValid(coll))
                    return resolve({ error: true, message: 'Request Param coll invalid' });

                const infoAfterInsert = await TYPE_COLLECTION_COLL.create({
                    coll, name, type, note, isUnique, isRequire, isTrim, isInsert, isUpdate, isSlug, isCurrency, isDefault, 
                    fileType, dateType, defaultValue, formatDate, ref, isEnum, dataEnum, isShowList, isOrder, isLink, isTinyMCE, isTextarea,
                    isBold, isItalic, isImage, typeImage, typeUpload, refShow, followBy, isStatus, widthDatatable, placeholder, tableSub, isPrimary,
                    isExport, isImport, isBigData, isInsertUpdateFrom, dataInsertUpdateFrom, isApiAddress
                });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    insertCustomAPI({ coll, method, endpoint, permission, note, typeGet, typePost, typeDelete, fields, fieldsPopulate }) {
        return new Promise(async (resolve) => {
            try {
                if(!coll || !ObjectID.isValid(coll))
                    return resolve({ error: true, message: 'Request Param coll invalid' });

                if(fields && fields.length){
                    fields = fields.map(field => field.input.name);
                }

                const infoAfterInsert = await CUSTOM_API_COLL.create({
                    coll, method, endpoint, permission, note, typeGet, typePost, typeDelete, fields, fieldsPopulate
                });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfo({ name }) {
        return new Promise(async (resolve) => {
            try {
                if(!name)
                    return resolve({ error: true, message: 'name_param_required' });

                let checkExists = await MANAGE_COLLECTION_COLL.findOne({ name: name.trim() });
                if(!checkExists)
                    return resolve({ error: true, data: "not_found_coll" });

                let listCollChoice = await HISTORY_EXPORT_COLL.findOne({ coll: checkExists._id }).sort({ createAt: -1 })
               
                return resolve({ error: false, data: checkExists, listCollChoice });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    insertHistoryExport({ coll, list_type_coll, listItemExport, chooseCSV, nameOfParentColl }) {
        return new Promise(async (resolve) => {
            try {
                if(!coll || !list_type_coll || !list_type_coll.length)
                    return resolve({ error: true, message: 'coll_list_type_coll_required' });

                let checkExists = await MANAGE_COLLECTION_COLL.findOne({ name: coll.trim() });
                if(!checkExists)
                    return resolve({ error: true, data: "not_found_coll" });

                let dataAfterInsert = await HISTORY_EXPORT_COLL.create({ 
                    coll: checkExists._id, 
                    list_type_coll: list_type_coll,
                    listItemExport,
                    chooseCSV,
                    nameOfParentColl,
                    createAt: new Date(), 
                    modifyAt: new Date() 
                });

                return resolve({ error: false, data: dataAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    insertHistoryImport({ coll, arrayFieldChoice, condition, listItemImport }) {
        return new Promise(async (resolve) => {
            try {
                if(!coll || !arrayFieldChoice || !arrayFieldChoice.length)
                    return resolve({ error: true, message: 'coll_arrayFieldChoice_required' });

                let checkExists = await MANAGE_COLLECTION_COLL.findOne({ name: coll.trim() });
                if(!checkExists)
                    return resolve({ error: true, data: "not_found_coll" });

                arrayFieldChoice.map((item, index) => {
                    arrayFieldChoice[index] = {
                        ...arrayFieldChoice[index],
                        isRequire: isTrue(arrayFieldChoice[index].isRequire),
                        coll: checkExists._id,
                        condition,
                        listItemImport,
                        createAt: new Date(),
                        modifyAt: new Date(),
                    }
                });
                
                let listHistoryAfterDelete = await HISTORY_IMPORT_COLL.deleteMany({ coll: checkExists._id });
                let dataAfterInsert = await HISTORY_IMPORT_COLL.insertMany(arrayFieldChoice);
               
                return resolve({ error: false, data: dataAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getInfoImport({ name }) {
        return new Promise(async (resolve) => {
            try {
                if(!name)
                    return resolve({ error: true, message: 'name_param_required' });

                let checkExists = await MANAGE_COLLECTION_COLL.findOne({ name: name.trim() });
                if(!checkExists)
                    return resolve({ error: true, data: "not_found_coll" });

                let listCollChoice         = await HISTORY_IMPORT_COLL.find({ coll: checkExists._id }).sort({ createAt: -1 })
                
                return resolve({ error: false, data: checkExists, listCollChoice });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    renderFilter({
        fields, offcanvasID
    }) {
        return new Promise(async resolve => {
            let outputFilterOptions     = '';
            let outputFilterBox         = '';
        
            // BỘ LỌC DANH SÁCH
            for (const input of fields) {
        
                if(input.isShowList === true){
                    outputFilterBox += renderOptionFilter(input);
        
                    // FILTER DYNAMIC
                    switch (input.type) {
                        case 'text':
                            outputFilterOptions += `
                                <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                            `;
                            break;
                        case 'number':
                            if(input.isEnum === true){
                                outputFilterOptions += `
                                    <option value="${input.name}" data-type="enum">${input.note || input.name}</option>
                                `;
                            } else{
                                outputFilterOptions += `
                                    <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                                `;
                            }
                            break;
                        case 'date':
                            outputFilterOptions += `
                                <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                            `;
                            break;
                        case 'object':
                            if(input.isImage) break;
        
                            if(input.ref){
                                outputFilterOptions += `<option value="${input.name}" data-type="ref">${input.note || input.name}</option>`;
        
                                const coll = await MANAGE_COLLECTION_COLL.findOne({ name: input.ref.trim() });
                                if(coll){
                                    const listFields = await TYPE_COLLECTION_COLL.find({ coll: coll._id }).lean();
        
                                    if(listFields && listFields.length){
                                        let outputFilterRefOptions = '';
                                        let outputFilterRefBox = '';
        
                                        for (const input of listFields) {
                                            outputFilterRefBox += renderOptionFilter(input);
        
                                            switch (input.type) {
                                                case 'text':
                                                case 'number':
                                                case 'date':
                                                    if(input.isEnum){
                                                        outputFilterRefOptions += `
                                                            <option value="${input.name}" data-type="enum">${input.note || input.name}</option>
                                                        `;
                                                    } else{
                                                        outputFilterRefOptions += `
                                                            <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                                                        `;
                                                    }
                                                    break;
                                                default:
                                                    break;
                                            }
                                        }
        
                                        outputFilterBox += `
                                            <div class="col-sm-8 d-none" data-follow="${input.name}">
                                                <select class="col-sm-4 form-select input-field-ref-name">
                                                    <option disabled selected>Chọn trường</option>
                                                    ${outputFilterRefOptions}
                                                    <option value="createAt" data-type="date">Ngày tạo</option>
                                                </select>
                                                ${outputFilterRefBox}
        
                                                <div class="col-sm-8 d-none" data-follow="createAt" data-type="date">
                                                    <select class="form-select input-field-compare">
                                                        <option value="equal" selected>Bằng</option>
                                                        <option value="not-equal">Không bằng</option>
                                                        <option value="before">Trước</option>
                                                        <option value="after">Sau</option>
                                                        <option value="today">Hôm nay</option>
                                                        <option value="yesterday">Hôm qua</option>
                                                        <option value="before-hours">N tiếng trước</option>
                                                        <option value="before-days">N ngày trước</option>
                                                        <option value="before-months">N tháng trước</option>
                                                        <option value="null">Trống</option>
                                                    </select>
        
                                                    <input type="date" class="form-control input-field-value">
                                                    <input type="number" class="form-control input-field-value d-none">
                                                </div>
                                            </div>
                                        `;
                                    }
                                }
        
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        
            let filter = `
                <div class="${offcanvasID}ID modal fade bd-example-modal-xl" tabindex="-1" id="${offcanvasID}ID" role="dialog" aria-labelledby="myExtraLargeModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl" role="document">
                        <div class="modal-content">
                    
                            <div class="modal-header">
                                <h5 id="${offcanvasID}Label" class="m-0" style="color: white;">Bộ lọc</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                
                                <div class="repeater-default">
                                    <div data-repeater-list="condition${offcanvasID}ID">
                
                                        <div data-repeater-item="" class="${offcanvasID}ID d-none">
                                            <div class="row d-flex justify-content-start">
                
                                                <div class="line-condition position-relative d-none">
                                                    <h2 class="type-condition ${offcanvasID}ID" _ref='${offcanvasID}' data-type-condition="AND">
                                                        <span class="badge badge-soft-primary">AND</span>
                                                    </h2>
                                                </div>
                
                                                <div class="col-sm-3">
                                                    <select class="form-select input-field-name">
                                                        <option disabled selected>Chọn trường</option>
                                                        ${outputFilterOptions}
                                                        <option value="createAt" data-type="date">Ngày tạo</option>
                                                    </select>
                                                </div>
                
                                                ${outputFilterBox}
                
                                                <div class="col-sm-8 d-none" data-follow="createAt" data-type="date">
                                                    <select class="form-select input-field-compare">
                                                        <option value="equal" selected>Bằng</option>
                                                        <option value="not-equal">Không bằng</option>
                                                        <option value="before">Trước</option>
                                                        <option value="after">Sau</option>
                                                        <option value="today">Hôm nay</option>
                                                        <option value="yesterday">Hôm qua</option>
                                                        <option value="before-hours">N tiếng trước</option>
                                                        <option value="before-days">N ngày trước</option>
                                                        <option value="before-months">N tháng trước</option>
                                                        <option value="null">Trống</option>
                                                    </select>
                
                                                    <input type="date" class="form-control input-field-value">
                                                    <input type="number" class="form-control input-field-value d-none">
                                                </div>
                
                                                <div class="col-sm-1">
                                                    <span data-repeater-delete="" class="btn btn-outline-danger">
                                                        <span class="far fa-trash-alt"></span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- END REPEATER ITEM -->
                
                                    </div>
                                    <!-- END REPEATER LIST -->
                
                                    <div class="form-group mb-0 mt-4 row">
                                        <div class="col-12 col-sm-4">
                                            <span class="btn btn-soft-secondary btn-add-filter" _ref='${offcanvasID}'>
                                                <span class="fas fa-plus"></span> Thêm điều kiện
                                            </span>
                                        </div>
                                    </div>
                                </div>
                
                            </div>
                            <!-- END OFFCANVAS-BODY -->
                            <hr class="hr-dashed hr-menu">
                            <div class="form-group mb-0 row" style="padding: 0 1rem 1rem 1rem !important;">
                                <div class="col-12 col-sm-6">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-lg btn-soft-primary btn-apply-filter" _ref='${offcanvasID}'>
                                            <i class="mdi mdi-check-all me-2"></i>
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-lg btn-soft-danger btn-discard-filter"  _ref='${offcanvasID}'>
                                            <!-- <i class="mdi mdi-alert-outline me-2"></i> -->
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return resolve({
                error: false,
                data: filter
            })
        })
    }

}

module.exports.MODEL = new Model;