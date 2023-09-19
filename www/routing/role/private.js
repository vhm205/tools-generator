"use strict";

const path                  = require('path');
const ChildRouter           = require('../child_routing');
const { isTrue }            = require('../../tools/module/check');

const { 
    generateSchema,
    generateModel,
    generateApi,
    generateView
} = require('../../tools');

const MANAGE_MODULE_COLL        = require('../../database/manage_module-coll');
const TYPE_COLLECTION_COLL      = require('../../database/type_coll-coll');
const MANAGE_COLLECTION_COLL    = require('../../database/manage_coll-coll');
const CUSTOM_API_COLL           = require('../../database/custom_api-coll');
const { MODEL: MANAGE_COLLECTION_MODEL }   = require('../../models/manage_coll');


module.exports = class Auth extends ChildRouter {
    constructor() {
        super('/');
    }

    registerRouting() {
        return {
            /**
             * ========================== ********************* ================================
             * ========================== QUẢN LÝ ROUTE PRIVATE ================================
             * ========================== ********************* ================================
             */

            '/admin/generate-tools': {
                config: {
					scopes: ['supervisor'],
                    type: 'view',
                    view: 'index.ejs',
					title: 'Power Of LDK - LDK SOFTWARE',
					code: 'DASHBOARD',
					inc: path.resolve(__dirname, '../../views/inc/supervisor/home.ejs')
                },
                methods: {
                    get: [ async function (req, res) {
                        let { coll } = req.query;

                        let listCollections = await MANAGE_COLLECTION_COLL.find({}).lean();
                        let listFields = [];
                        let listAPICustom = [];
                        let infoCollection = {};

                        if(coll){
                            infoCollection = await MANAGE_COLLECTION_COLL.findById(coll).lean();
                            listFields = await TYPE_COLLECTION_COLL.find({ coll }).sort({ _id: 1 }).lean();
                            listAPICustom = await CUSTOM_API_COLL.find({ coll }).sort({ _id: 1 }).lean();
                        }

                        ChildRouter.renderToView(req, res, { 
                            infoCollection,
                            listCollections,
                            listFields,
                            listAPICustom
                        });
                    }]
                }
            },

            '/delete-coll/:coll': {
                config: {
					scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
                        let { coll } = req.params;

                        await MANAGE_COLLECTION_COLL.deleteOne({ _id: coll });
                        await TYPE_COLLECTION_COLL.deleteMany({ coll });
                        await MANAGE_MODULE_COLL.updateMany({
                            models: { $in: [coll] }
                        }, {
                            $pull: {
                                models: coll
                            }
                        });

                        res.sendStatus(204);
                    }]
                }
            },

            '/generate-package': {
                config: {
					scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    post: [ async function (req, res) {
                        const {
                            collectionName, collectionDescription, fields, fieldsExcept, pathSave, folderName, 
                            icon, isServerSide, extendsAPI, conditionCreatePackage, isApiAddress, isSystemConfig
                        } = req.body;

                        if(!collectionName || !fields.length || !pathSave){
                            return res.json({ error: true, message: 'Request Params Invalid' });
                        }

						const blacklistPackage = ['auth', 'common', 'image', 'users', 'upload-s3'];

						if(blacklistPackage.includes(folderName.toLowerCase())){
                            return res.json({ error: true, message: 'Tên folder không được phép sử dụng' });
						}

                        try {
                            let checkExists = await MANAGE_COLLECTION_MODEL.insertCollection({
                                name: collectionName,
                                description: collectionDescription,
                                folderName,
                                icon,
                                isApiAddress: isTrue(isApiAddress),
                                isSystemConfig: isTrue(isSystemConfig),
                            });

                            if(checkExists.error)
                                return res.json(checkExists);

                            // INSERT FIELD GENERATE
                            await TYPE_COLLECTION_COLL.deleteMany({ coll: checkExists.data._id });
                            const listFieldsPromise = fields.map(field => MANAGE_COLLECTION_MODEL.insertFieldCollection({
                                coll: checkExists.data._id,
                                name: field.input.name,
                                type: field.input.type,
                                note: field.input.note,
                                placeholder: field.input.placeholder,
                                isCompare: isTrue(field.input.isCompare),
                                isPrimary: isTrue(field.input.isPrimary), 
                                isUnique: isTrue(field.input.isUnique), 
                                isRequire: isTrue(field.input.isRequire), 
                                isRequire: isTrue(field.input.isRequire), 
                                isTrim: isTrue(field.input.isTrim), 
                                isInsert: isTrue(field.input.isInsert), 
                                isUpdate: isTrue(field.input.isUpdate), 
                                isSlug: isTrue(field.input.isSlug),
                                isCurrency: isTrue(field.input.isCurrency),
                                isDefault: isTrue(field.input.isDefault), 
                                defaultValue: field.input.default,
                                isEnum: isTrue(field.input.isEnum),
                                dataEnum: field.input.dataEnum || [],
                                isSeparateCondition: isTrue(field.input.isSeparateCondition),
                                dataCompareField: field.input.dataCompareField || [],
                                messageError: field.input.messageError,
                                formatDate: field.input.formatDate,
                                isShowList: isTrue(field.input.isShowList),
                                isTinyMCE: isTrue(field.input.isTinyMCE),
                                isTextarea: isTrue(field.input.isTextarea),
                                isBold: isTrue(field.input.isBold),
                                isItalic: isTrue(field.input.isItalic),
                                isImage: isTrue(field.input.isImage),
                                isStatus: isTrue(field.input.isStatus),
                                isOrder: isTrue(field.input.isOrder),
                                isLink: isTrue(field.input.isLink),
                                isExport: isTrue(field.input.isExport),
                                isImport: isTrue(field.input.isImport),
                                isBigData: isTrue(field.input.isBigData),
                                isInsertUpdateFrom: isTrue(field.input.isInsertUpdateFrom),
                                isApiAddress: isTrue(field.input.isApiAddress),
                                dataInsertUpdateFrom: field.input.dataInsertUpdateFrom || [],
                                fileType: field.input.fileType,
                                dateType: field.input.dateType,
                                typeImage: field.input.typeImage,
                                typeUpload: field.input.typeUpload,
                                ref: field.input.ref,
                                refShow: field.input.refShow,
                                followBy: field.input.followBy,
                                tableSub: field.input.tableSub,
                                widthDatatable: field.input.widthDatatable
                            }))
                            await Promise.all(listFieldsPromise);

                            // INSERT CUSTOM API
                            if(extendsAPI && extendsAPI.length){
                                await CUSTOM_API_COLL.deleteMany({ coll: checkExists.data._id });
                                const listCustomApiPromise = extendsAPI.map(api => MANAGE_COLLECTION_MODEL.insertCustomAPI({
                                    coll: checkExists.data._id, 
                                    method: api.method,
                                    endpoint: api.endpoint,
                                    authenticate: api.authenticate,
                                    authorize: api.authorize,
                                    note: api.note,
                                    typeGet: api.typeGet,
                                    typePost: api.typePost,
                                    typeDelete: api.typeDelete,
                                    fields: api.fields,
                                    fieldsPopulate: api.fieldsPopulate,
                                }))
                                await Promise.all(listCustomApiPromise);
                            }

                            const { isCreateSchema, isCreateApi, isCreateModel, isCreateView, isCreateScript } = conditionCreatePackage;

                            if(isTrue(isCreateSchema)){
                                await generateSchema(collectionName, collectionDescription, fields, pathSave, folderName);
                            }

                            if(isTrue(isCreateApi)){
                                await generateApi(collectionName, collectionDescription, fields, fieldsExcept, pathSave, isTrue(isServerSide), folderName, extendsAPI, isTrue(isSystemConfig));
                            }

                            if(isTrue(isCreateModel)){
                                await generateModel(collectionName, collectionDescription, fields, fieldsExcept, pathSave, isTrue(isServerSide), folderName, extendsAPI, isTrue(isApiAddress), isTrue(isSystemConfig));
                            }

                            if(isTrue(isCreateView) || isTrue(isCreateScript)){
                                await generateView(collectionName, collectionDescription, fields, fieldsExcept, pathSave, isTrue(isServerSide), folderName, conditionCreatePackage, isTrue(isApiAddress), icon, isTrue(isSystemConfig));
                            }

                            return res.json({ error: false, message: 'Create success' });
                        } catch (error) {
                            return res.json({ error: true, message: error.message });
                        }
                    }]
                },
            },

            '/list-field-by-coll': {
                config: {
					scopes: ['supervisor'],
                    type: 'json',
                },
                methods: {
                    get: [ async function (req, res) {
                        let { name } = req.query;

                        let infoColl = await MANAGE_COLLECTION_COLL
                            .findOne({ name: name.trim() })
                            .lean();

                        let listFields = await TYPE_COLLECTION_COLL
                            .find({ coll: infoColl?._id })
                            .lean();

                        res.json({ listFields, infoColl });
                    }]
                },
            },

            
        }
    }
};
