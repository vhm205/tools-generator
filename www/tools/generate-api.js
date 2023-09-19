const check         = require('./module/check');
const beautifyerJS  = require('js-beautify').js_beautify;
const fs            = require('fs');
const moment        = require('moment');
const logger		= require('../config/logger/winston.config');
const chalk         = require('chalk');
const log           = console.log;

const MANAGE__COLL_COLL     = require('../database/manage_coll-coll');
const API_MANAGEMENT__MODEL = require('../packages/auth/models/api_management').MODEL;

function renderExtendsApi(collectionName, extendsAPI = []) {
    const NAME_COLL_UPPERCASE   = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE   = collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE 	= collectionName.toCapitalize();
    let outputHtmlExtendsAPI    = '';

    extendsAPI.map(api => {
        let CONSTANT_ROUTE      = '';
        let funcName            = '';
        let params              = '';
        let outputUploadFile    = '';
        let permissionAuthor    = { get: '', set: '' };
        let hasAuthenticate     = api.authenticate === 'permission';
        let hasAuthorize        = api.authorize === 'authorize';
        let ENDFIX              = hasAuthenticate ? '_OF_ME' : '';

        if(hasAuthenticate && hasAuthorize) {
            permissionAuthor = {
                get: 'const authorID = req.user && req.user._id;',
                set: 'authorID',
            }
        }

        if(api.method === 'POST' || api.method === 'PUT'){
            api.fields && api.fields.map(row => {
                const input = row.input;
                params += `${input.name}, `;

                if(check.isTrue(input.isImage)){
                    if(input.type === 'object'){
                        outputUploadFile += `
                            if(${input.name}){
                                let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                    name: ${input.name}.name,
                                    path: ${input.name}.path,
                                    type: ${input.name}.type,
                                    size: ${input.name}.size
                                });
                                ${input.name} = infoImageAfterInsert.data._id;
                            }
                        `;
                    }

                    if(input.type === 'array'){
                        outputUploadFile += `
                            if(${input.name} && ${input.name}.length){

                                let listFiles = ${input.name}.map(item => IMAGE_MODEL.insert({
                                    name: item.name,
                                    path: item.path,
                                    type: item.type,
                                    size: item.size
                                }))
                                listFiles = await Promise.all(listFiles);

                                ${input.name} = listFiles.map(file => file.data._id);
                            }
                        `;
                    }
                }
            })
        }

        switch (api.method) {
            case 'GET': {
                if(api.typeGet === 'get-list'){
                    outputHtmlExtendsAPI += `
                        /**
                         * Function: ${api.note ? api.note : `API Get list ${NAME_COLL_CAPITALIZE}`}
                         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                         * Dev: Automatic
                         */
                        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.${`API_GET_LIST_${NAME_COLL_UPPERCASE}S`}${ENDFIX}]: {
                            config: {
                                scopes: [ '${hasAuthenticate ? `read:list_${NAME_COLL_LOWERCASE}` : 'public' }' ],
                                type: 'json',
                            },
                            methods: {
                                get: [ async function(req, res){
                                    ${permissionAuthor.get}
                                    const { select, filter, explain, sort, search, limit, page } = req.query;

                                    const list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_MODEL.getList${NAME_COLL_CAPITALIZE}s({
                                        select, filter, explain, sort, search, limit, page, ${permissionAuthor.set}
                                    });
                                    res.json(list${NAME_COLL_CAPITALIZE}s);
                                }]
                            },
                        },
                    `;
                } else{
                    outputHtmlExtendsAPI += `
                        /**
                         * Function: ${api.note ? api.note : `API Get info ${NAME_COLL_CAPITALIZE}`}
                         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                         * Dev: Automatic
                         */
                        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.${`API_GET_INFO_${NAME_COLL_UPPERCASE}`}${ENDFIX}]: {
                            config: {
                                scopes: [ '${hasAuthenticate ? `read:info_${NAME_COLL_LOWERCASE}` : 'public' }' ],
                                type: 'json',
                            },
                            methods: {
                                get: [ async function(req, res){
                                    ${permissionAuthor.get}
                                    const { ${NAME_COLL_LOWERCASE}ID } = req.params;
                                    const { select, filter, explain } = req.query;

                                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.getInfo${NAME_COLL_CAPITALIZE}({
                                        ${NAME_COLL_LOWERCASE}ID, select, filter, explain, ${permissionAuthor.set}
                                    });
                                    res.json(response);
                                }]
                            },
                        },
                    `;
                }
                break;
            }
            case 'POST': {
                if(api.typePost === 'create-many'){
                    CONSTANT_ROUTE = `API_ADD_${NAME_COLL_UPPERCASE}S${ENDFIX}`;
                    funcName = `insert${NAME_COLL_CAPITALIZE}s`;
                } else{
                    CONSTANT_ROUTE = `API_ADD_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                    funcName = `insert${NAME_COLL_CAPITALIZE}`;
                }

                outputHtmlExtendsAPI += `
                    /**
                     * Function: ${api.note ? api.note : `API Insert ${NAME_COLL_CAPITALIZE}`}
                     * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                     * Dev: Automatic
                     */
                    [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.${CONSTANT_ROUTE}]: {
                        config: {
                            scopes: [ '${hasAuthenticate ? `create:${NAME_COLL_LOWERCASE}` : 'public' }' ],
                            type: 'json',
                        },
                        methods: {
                            post: [ async function(req, res){
                                const authorID = req.user && req.user._id;
                                const { ${api.typePost === 'create-many' ? 'fields' : params} } = req.body;

                                ${outputUploadFile}
                                const response = await ${NAME_COLL_UPPERCASE}_MODEL.${funcName}({
                                    ${api.typePost === 'create-many' ? 'fields,' : params} authorID
                                });
                                res.json(response);
                            }]
                        },
                    },
                `;
                break;
            }
            case 'PUT': {
                CONSTANT_ROUTE = `API_UPDATE_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                funcName = `update${NAME_COLL_CAPITALIZE}`;

                outputHtmlExtendsAPI += `
                    /**
                     * Function: ${api.note ? api.note : `API Update ${NAME_COLL_CAPITALIZE}`}
                     * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                     * Dev: Automatic
                     */
                    [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.${CONSTANT_ROUTE}]: {
                        config: {
                            scopes: [ '${hasAuthenticate ? `update:${NAME_COLL_LOWERCASE}` : 'public' }' ],
                            type: 'json',
                        },
                        methods: {
                            put: [ async function(req, res){
                                let authorID = req.user && req.user._id;
                                let { ${NAME_COLL_LOWERCASE}ID } = req.params;
                                let { ${params} } = req.body;

                                ${outputUploadFile}
                                let response = await ${NAME_COLL_UPPERCASE}_MODEL.${funcName}({
                                    ${NAME_COLL_LOWERCASE}ID, ${params} authorID
                                });
                                res.json(response);
                            }]
                        },
                    },
                `;
                break;
            }
            case 'DELETE': {
                if(api.typeDelete === 'delete-many'){
                    CONSTANT_ROUTE = `API_DELETE_${NAME_COLL_UPPERCASE}S${ENDFIX}`;
                    funcName = `delete${NAME_COLL_CAPITALIZE}s`;
                    params  = `${NAME_COLL_LOWERCASE}sID`;
                } else{
                    CONSTANT_ROUTE = `API_DELETE_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                    funcName = `delete${NAME_COLL_CAPITALIZE}`;
                    params = `${NAME_COLL_LOWERCASE}ID`;
                }

                if(api.endpoint){
                    let index = api.endpoint.lastIndexOf(':');
                    params = api.endpoint.substr(index + 1, api.endpoint.length);
                }

                outputHtmlExtendsAPI += `
                    /**
                     * Function: ${api.note ? api.note : `API Delete ${NAME_COLL_CAPITALIZE}`}
                     * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                     * Dev: Automatic
                     */
                    [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.${CONSTANT_ROUTE}]: {
                        config: {
                            scopes: [ '${hasAuthenticate ? `delete:${NAME_COLL_LOWERCASE}` : 'public' }' ],
                            type: 'json',
                        },
                        methods: {
                            delete: [ async function(req, res){
                                ${permissionAuthor.get}
                                const { ${params} } = req.params;

                                const response = await ${NAME_COLL_UPPERCASE}_MODEL.${funcName}(${params}${permissionAuthor.set ? `, ${permissionAuthor.set}` : ''});
                                res.json(response);
                            }]
                        },
                    },
                `;

                break;
            }
            default:
                break;
        }
    })

    return outputHtmlExtendsAPI;
}

async function createContentApi(fields, fieldsExcept, collectionName, isServerSide, pathSave, folderName, extendsAPI, isSystemConfig) {
	const NAME_COLL_UPPERCASE 	= collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE 	= collectionName.toCapitalize();

    // OUTPUT FUNCTION INSERT
    let outputFieldInsert               = '';
    let outputUploadFileInsert          = '';

    // OUTPUT FUNCTION UPDATE BY ID
    let outputFieldUpdate               = '';
    let outputUploadFileUpdate          = '';

    // OUTPUT FUNCTION GET LIST BY FILTER
    let outputParamsFilter              = '';

    // OUTPUT CONSTANTS ENUM
    let outputImportConstant            = '';

    let outputRequirePackageRef         = [];
    let outputRequirePackage            = '';
    let outputRequirePackageTableSub    = '';
    let outputRefGetListInsert          = '';
    let outputInfoLastRecord            = '';
    let outputRefGetListUpdate          = '';
    let outputRefResponseListInsert     = '';
    let outputRefResponseListUpdate     = '';
    let outputGetListTableSub           = [];
    let packageRefInsert                = [];
    let packageRefUpdate                = [];

    // Sort Add/Update Ref
    let outputSortAddRef                = '';

    // Follow by parent
    let outputApiFollowBy               = '';
    let outputApiTableSub               = '';

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    for (const field of fields) {
        let input = field.input;

        if(input.type === 'text' && !outputParamsFilter.includes('keyword')){
            outputParamsFilter += `keyword, `;
        }

        if(input.type === 'date'){
            outputParamsFilter += `${input.name}DateRange, `;
        }

        if(input.type === 'number'){
            if(check.isTrue(input.isEnum)){
                outputParamsFilter += `${input.name}, `;
            }
            if(check.isTrue(input.isCurrency)){
                outputParamsFilter += `${input.name}FromNumber, ${input.name}ToNumber, `;
            }
            if(check.isTrue(input.isOrder)){
                outputSortAddRef += `${input.name}: 1, `;
            }
        }

        if(check.isTrue(input.isEnum)){
            outputImportConstant += `${input.name.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE, `;
        }

        if(check.isTrue(input.isInsert)){

            if(!listFieldsExcept.includes(input.name)){
                outputFieldInsert += `${input.name},`;
            }

            if(check.isTrue(input.isImage)){
                if(input.type === 'object'){
                    outputUploadFileInsert += `
                        if(${input.name}){
                            let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                name: ${input.name}.name,
                                path: ${input.name}.path,
                                type: ${input.name}.type,
                                size: ${input.name}.size
                            });
                            ${input.name} = infoImageAfterInsert.data._id;
                        }
                    `;
                }

                if(input.type === 'array'){
                    outputUploadFileInsert += `
                        if(${input.name} && ${input.name}.length){

                            let listFiles = ${input.name}.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            ${input.name} = listFiles.map(file => file.data._id);
                        }
                    `;
                }
            } else{
                if(input.ref && !input.followBy){
                    let packageRefUp  = input.ref.toUpperCase();
                    let fieldNameCap  = input.name.toCapitalize();

                    outputRequirePackageRef[outputRequirePackageRef.length] = input.ref;

                    /**
                     * Mix condition
                     * - Check duplicate require
                     * - Is not big data
                     * - Is not in list fields except
                     */
                    if(!packageRefInsert.includes(input.ref) && !check.isTrue(input.isBigData) && !listFieldsExcept.includes(input.name)){
                        outputRefGetListInsert += `
                            let list${fieldNameCap}s = await ${packageRefUp}_MODEL.find({ state: 1, status: 1 }).sort({${outputSortAddRef} modifyAt: -1}).lean();
                        `;
                        outputRefResponseListInsert += `list${fieldNameCap}s,`;
                        // packageRefInsert = [...packageRefInsert, input.ref];
                    }
                }
            }

        }

        if(check.isTrue(input.isUpdate)){

            if(!listFieldsExcept.includes(input.name)){
                outputFieldUpdate += `${input.name},`;
            }

            if(check.isTrue(input.isImage)){
                if(input.type === 'object'){
                    outputUploadFileUpdate += `
                        if(${input.name}){
                            let infoImageAfterInsert = await IMAGE_MODEL.insert({
                                name: ${input.name}.name,
                                path: ${input.name}.path,
                                type: ${input.name}.type,
                                size: ${input.name}.size
                            });
                            ${input.name} = infoImageAfterInsert.data._id;
                        }
                    `;
                }

                if(input.type === 'array'){
                    outputUploadFileUpdate += `
                        if(${input.name} && ${input.name}.length){
                            let listFiles = ${input.name}.map(item => IMAGE_MODEL.insert({
                                name: item.name,
                                path: item.path,
                                type: item.type,
                                size: item.size
                            }))
                            listFiles = await Promise.all(listFiles);

                            ${input.name} = listFiles.map(file => file.data._id);
                        }
                    `;
                }
            } else{

                if(input.ref){
                    let packageRefUp  = input.ref.toUpperCase();
                    let fieldNameCap  = input.name.toCapitalize();

                    outputRequirePackageRef[outputRequirePackageRef.length] = input.ref;

                    if(check.isTrue(input.isBigData)){
                        let htmlConditionGetList = `
                            condition${fieldNameCap}._id = info${NAME_COLL_CAPITALIZE}.data.${input.name}?._id;
                        `;

                        if(input.type === 'array'){
                            htmlConditionGetList = `
                                let listIDs = info${NAME_COLL_CAPITALIZE}.data?.${input.name}.map(item => item._id);
                                condition${fieldNameCap}._id = { $in: listIDs };
                            `;
                        }

                        outputRefGetListUpdate += `
                            let condition${fieldNameCap} = { state: 1, status: 1 };
                            if(info${NAME_COLL_CAPITALIZE}.data?.${input.name}){
                                ${htmlConditionGetList}
                            }

                            let list${fieldNameCap}s = await ${packageRefUp}_MODEL
                                .find(condition${fieldNameCap})
                                .sort({ modifyAt: -1, createAt: -1, _id: -1 })
                                .limit(1)
                                .lean();
                        `;

                        outputRefResponseListUpdate += `list${fieldNameCap}s,`;
                    }

                    /**
                     * Meet to condition
                     * - Check duplicate require
                     * - Is not in list fields except
                     * - Is not big data
                     */
                    if(!packageRefUpdate.includes(input.ref) && !listFieldsExcept.includes(input.name) && !check.isTrue(input.isBigData)){

                        if(input.followBy){
                            outputRefGetListUpdate += `
                                let list${fieldNameCap}s = [];
                                if(info${NAME_COLL_CAPITALIZE}.data.${input.followBy}){
                                    list${fieldNameCap}s = await ${packageRefUp}_MODEL
                                        .find({
                                            ${input.followBy}: info${NAME_COLL_CAPITALIZE}.data.${input.followBy}._id,
                                            state: 1, status: 1
                                        })
                                        .sort({ modifyAt: -1, createAt: -1, _id: -1 })
                                        .lean();
                                }
                            `;
                        } else{
                            if(NAME_COLL_LOWERCASE === input.ref){
                                outputRefGetListUpdate += `
                                    let list${fieldNameCap}s = await ${packageRefUp}_MODEL
                                        .find({
                                            _id: { $nin: [info${NAME_COLL_CAPITALIZE}?.data._id] },
                                            state: 1, status: 1
                                        })
                                        .sort({ modifyAt: -1, createAt: -1, _id: -1 })
                                        .lean();
                                `;
                            } else{
                                outputRefGetListUpdate += `
                                    let list${fieldNameCap}s = await ${packageRefUp}_MODEL
                                        .find({ state: 1, status: 1 })
                                        .sort({ modifyAt: -1, createAt: -1, _id: -1 })
                                        .lean();
                                `;
                            }
                        }

                        outputRefResponseListUpdate += `list${fieldNameCap}s,`;
                        // packageRefUpdate = [...packageRefUpdate, input.ref];
                    }

                }
            }

        }

        if(input.followBy){
             // API FOLLOW BY
            outputApiFollowBy += `
                /**
                 * Function: Get List ${input.name} By parent (API)
                 * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                 * Dev: Automatic
                 */
                '/${NAME_COLL_LOWERCASE}/list-${input.name.toLowerCase()}-by-parent': {
                    config: {
                        scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                        type: 'json',
                    },
                    methods: {
                        get: [ async function(req, res){
                            const { ${input.followBy} } = req.query;

                            const list${input.name.toCapitalize()}ByParent = await ${input.name.toUpperCase()}_MODEL
                                .find({ ${input.followBy} })
                                .lean();
                            res.json(list${input.name.toCapitalize()}ByParent);
                        }]
                    },
                },
            `;
        }

        if(input.tableSub){
            const FIELD_REF_CAPITALIZE = input.ref.toCapitalize();
            const FIELD_REF_LOWERCASE  = input.ref.toLowerCase();

            // const infoColl = await MANAGE__COLL_COLL.findOne({ name: input.tableSub.trim() }).select('folderName').lean();

            // outputRequirePackageTableSub += `
            //     const { MODEL: ${input.tableSub.toUpperCase()}_MODEL } = require('../../${infoColl.folderName}/models/${input.tableSub}');
            // `;

            outputApiTableSub += `
                /**
                 * Function: Get List ${FIELD_REF_LOWERCASE} table sub (API)
                 * Date: ${moment(new Date()).format('DD/MM/YYYY')}
                 * Dev: Automatic
                 */
                '/${NAME_COLL_LOWERCASE}/list-${FIELD_REF_LOWERCASE}-table-sub': {
                    config: {
                        scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                        type: 'json',
                    },
                    methods: {
                        post: [ async function(req, res){
                            const { idsSelected, keyword, filter, condition, start, length } = req.body;
                            const page = Number(start) / Number(length) + 1;

                            const list${FIELD_REF_CAPITALIZE}ServerSide = await ${NAME_COLL_UPPERCASE}_MODEL.getList${FIELD_REF_CAPITALIZE}ServerSideTableSub({
                                idsSelected,
                                keyword,
                                filter,
                                condition,
                                page,
                                limit: length,
                            });
                            res.json(list${FIELD_REF_CAPITALIZE}ServerSide);
                        }]
                    },
                },
            `;

            outputGetListTableSub = [...outputGetListTableSub, {
                list: `
                    let list${input.tableSub.toCapitalize()} = await ${input.tableSub.toUpperCase()}_MODEL.find({
                        ${NAME_COLL_LOWERCASE}: info${NAME_COLL_CAPITALIZE}.data._id
                    }).lean();
                `,
                get: `list${input.tableSub.toCapitalize()},`
            }];
        }

        

    }

    if (isSystemConfig) {
        outputInfoLastRecord += `
            let info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_MODEL.getInfoLastRecord({});
        `;
        outputRefResponseListInsert += `info${NAME_COLL_CAPITALIZE}: info${NAME_COLL_CAPITALIZE}.data,`;
    }

    
    if(outputRequirePackageRef && outputRequirePackageRef.length){
        let folderPackage = `${pathSave}/www/packages/${folderName}`;
        let existsCollections = [];

        outputRequirePackageRef = [...new Set(outputRequirePackageRef)];
        for (const package of outputRequirePackageRef) {
            let packageRefLow = package.toLowerCase();
            let packageRefUp  = package.toUpperCase();
            let isSameFolder  = false;

            if(fs.existsSync(folderPackage)){
                fs.readdirSync(`${folderPackage}/databases`).map(filename => {
                    if(packageRefLow === filename.slice(0, -8)){
                        isSameFolder = true;
                    }
                })
            }

            if(!existsCollections.includes(packageRefLow)) {
                const infoColl = await MANAGE__COLL_COLL.findOne({ name: packageRefLow }).select('folderName').lean();

                if(isSameFolder){
                    // const ${packageRefUp}_COLL = require('../databases/${packageRefLow}-coll');
                    outputRequirePackage += `
                        const { MODEL: ${packageRefUp}_MODEL } = require('../models/${packageRefLow}');
                    `;
                } else{
                    // const ${packageRefUp}_COLL = require('../../${infoColl?.folderName || packageRefLow}/databases/${packageRefLow}-coll');
                    outputRequirePackage += `
                        const { MODEL: ${packageRefUp}_MODEL } = require('../../${infoColl?.folderName || packageRefLow}/models/${packageRefLow}');
                    `;
                }
            }

            existsCollections = [...existsCollections, packageRefLow];
        }
    }

    let outputtedFile = `
        /**
         * EXTERNAL PACKAGE
         */
        const path          = require('path');
        const fs            = require('fs');
        const moment        = require('moment');

        /**
         * INTERNAL PACKAGE
         */
        const ChildRouter = require('../../../routing/child_routing');
        const { ${outputImportConstant} } = require('../constants/${NAME_COLL_LOWERCASE}');
        const { CF_ROUTINGS_${NAME_COLL_UPPERCASE} } = require('../constants/${NAME_COLL_LOWERCASE}/${NAME_COLL_LOWERCASE}.uri');
        const { uploadSingle } = require('../../../config/cf_helpers_multer');

        /**
         * MODELS
         */
        ${(outputUploadFileUpdate || outputUploadFileInsert) && "const { MODEL: IMAGE_MODEL } = require('../../image/models/image');"}
        const { MODEL: ${NAME_COLL_UPPERCASE}_MODEL } = require('../models/${NAME_COLL_LOWERCASE}');
        const { MODEL: MANAGE_COLL_MODEL } = require('../../../models/manage_coll');
        ${outputRequirePackage}
        ${outputRequirePackageTableSub}

        module.exports = class Auth extends ChildRouter {
            constructor() {
                super('/');
            }

            registerRouting() {
                return {
                    /**
                     * =============================== ************* ===============================
                     * =============================== QUẢN LÝ ${NAME_COLL_UPPERCASE}  ===============================
                     * =============================== ************* ===============================
                     */

                    ${outputApiFollowBy}
                    ${outputApiTableSub}
    `;

    // API INSERT
    outputtedFile += `
        /**
         * Function: Insert ${NAME_COLL_CAPITALIZE} (API, VIEW)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.ADD_${NAME_COLL_UPPERCASE}]: {
            config: {
				scopes: [ 'create:${NAME_COLL_LOWERCASE}' ],
                type: 'view',
                view: 'index.ejs',
                title: 'Thêm ${NAME_COLL_CAPITALIZE}',
                code: CF_ROUTINGS_${NAME_COLL_UPPERCASE}.ADD_${NAME_COLL_UPPERCASE},
                inc: path.resolve(__dirname, '../views/${NAME_COLL_LOWERCASE}/add_${NAME_COLL_LOWERCASE}.ejs')
            },
            methods: {
                get: [ async function(req, res){
                    ${outputRefGetListInsert ? outputRefGetListInsert : ''}
                    ${outputInfoLastRecord}
                    ChildRouter.renderToView(req, res, {
                        ${outputRefResponseListInsert}
                        CF_ROUTINGS_${NAME_COLL_UPPERCASE}
                    });
                }],
                post: [ async function(req, res){
                    let userCreate = req.user && req.user._id;
                    let { ${outputFieldInsert} } = req.body;

                    ${outputUploadFileInsert}
                    let response = await ${NAME_COLL_UPPERCASE}_MODEL.insert({
                        ${outputFieldInsert} userCreate
                    });
                    res.json(response);
                }]
            },
        },
    `;

    // API UPDATE BY ID
    outputtedFile += `
        /**
         * Function: Update ${NAME_COLL_CAPITALIZE} By Id (API, VIEW)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.UPDATE_${NAME_COLL_UPPERCASE}_BY_ID]: {
            config: {
                scopes: [ 'update:${NAME_COLL_LOWERCASE}' ],
                type: 'view',
                view: 'index.ejs',
                title: 'Cập nhật ${NAME_COLL_CAPITALIZE}',
                code: CF_ROUTINGS_${NAME_COLL_UPPERCASE}.UPDATE_${NAME_COLL_UPPERCASE}_BY_ID,
                inc: path.resolve(__dirname, '../views/${NAME_COLL_LOWERCASE}/update_${NAME_COLL_LOWERCASE}.ejs')
            },
            methods: {
                get: [ async function(req, res){
                    let { ${NAME_COLL_LOWERCASE}ID } = req.query;

                    let info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_MODEL.getInfoById(${NAME_COLL_LOWERCASE}ID);
                    if(info${NAME_COLL_CAPITALIZE}.error){
                        return res.redirect('/something-went-wrong');
                    }

                    ${outputRefGetListUpdate}
                    ${outputGetListTableSub.length ? outputGetListTableSub.map(output => output.list) : ''}
                    ChildRouter.renderToView(req, res, {
                        info${NAME_COLL_CAPITALIZE}: info${NAME_COLL_CAPITALIZE}.data || {},
                        ${outputGetListTableSub.length ? outputGetListTableSub.map(output => output.get) : ''}
                        ${outputRefResponseListUpdate}
                        CF_ROUTINGS_${NAME_COLL_UPPERCASE}
                    });
                }],
                put: [ async function(req, res){
                    let userUpdate = req.user && req.user._id;
                    let { ${NAME_COLL_LOWERCASE}ID, ${outputFieldUpdate} } = req.body;

                    ${outputUploadFileUpdate}
                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.update({
                        ${NAME_COLL_LOWERCASE}ID, ${outputFieldUpdate} userUpdate
                    });
                    res.json(response);
                }]
            },
        },
    `;

    // API UPDATE BY ID NOT REQUIRE
    outputtedFile += `
        /**
         * Function: Update not require ${NAME_COLL_CAPITALIZE} By Id (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.UPDATE_${NAME_COLL_UPPERCASE}_NOT_REQUIRE_BY_ID]: {
            config: {
                scopes: [ 'update:${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                post: [ async function(req, res){
                    let userUpdate = req.user && req.user._id;
                    let { ${NAME_COLL_LOWERCASE}ID, ${outputFieldUpdate} } = req.body;

                    ${outputUploadFileUpdate}
                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.updateNotRequire({
                        ${NAME_COLL_LOWERCASE}ID, ${outputFieldUpdate} userUpdate
                    });
                    res.json(response);
                }]
            },
        },
    `;

    // API DELETE BY ID
    outputtedFile += `
        /**
         * Function: Delete ${NAME_COLL_CAPITALIZE} By Id (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.DELETE_${NAME_COLL_UPPERCASE}_BY_ID]: {
            config: {
                scopes: [ 'delete:${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                delete: [ async function(req, res){
                    const { ${NAME_COLL_LOWERCASE}ID } = req.params;

                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.deleteById(${NAME_COLL_LOWERCASE}ID);
                    res.json(response);
                }]
            },
        },
    `;

    // API DELETE BY LIST ID
    outputtedFile += `
        /**
         * Function: Delete ${NAME_COLL_CAPITALIZE} By List Id (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.DELETE_${NAME_COLL_UPPERCASE}_BY_LIST_ID]: {
            config: {
                scopes: [ 'delete:${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                post: [ async function(req, res){
                    const { ${NAME_COLL_LOWERCASE}ID } = req.body;

                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.deleteByListId(${NAME_COLL_LOWERCASE}ID);
                    res.json(response);
                }]
            },
        },
    `;

    // API GET INFO BY ID
    outputtedFile += `
        /**
         * Function: Get Info ${NAME_COLL_CAPITALIZE} By Id (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_INFO_${NAME_COLL_UPPERCASE}_BY_ID]: {
            config: {
                scopes: [ 'read:info_${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                get: [ async function(req, res){
                    const { ${NAME_COLL_LOWERCASE}ID } = req.params;

                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.getInfoById(${NAME_COLL_LOWERCASE}ID);
                    res.json(response);
                }]
            },
        },
    `;

    // VIEW GET LIST
    outputtedFile += `
        /**
         * Function: Get List ${NAME_COLL_CAPITALIZE} (API, VIEW)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}]: {
            config: {
				scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                type: 'view',
                view: 'index.ejs',
                title: 'Danh sách ${NAME_COLL_CAPITALIZE}',
                code: CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE},
                inc: path.resolve(__dirname, '../views/${NAME_COLL_LOWERCASE}/list_${NAME_COLL_LOWERCASE}s.ejs')
            },
            methods: {
                get: [ async function(req, res){
                    let { ${outputParamsFilter} typeGetList } = req.query;

                    let list${NAME_COLL_CAPITALIZE}s = [];
                    if(typeGetList === 'FILTER'){
                        list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_MODEL.getListByFilter({
                            ${outputParamsFilter}
                        });
                    } else{
                        list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_MODEL.getList();
                    }

                    ChildRouter.renderToView(req, res, {
                        list${NAME_COLL_CAPITALIZE}s: list${NAME_COLL_CAPITALIZE}s.data || [],
                        ${outputImportConstant}
                    });
                }]
            },
        },
    `;

    // VIEW GET LIST FLEXIABLE FIELD
    outputtedFile += `
        /**
         * Function: Get List ${NAME_COLL_CAPITALIZE} By Field (API, VIEW)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}_BY_FIELD]: {
            config: {
				scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                type: 'view',
                view: 'index.ejs',
                title: 'Danh sách ${NAME_COLL_CAPITALIZE} by field isStatus',
                code: CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}_BY_FIELD,
                inc: path.resolve(__dirname, '../views/${NAME_COLL_LOWERCASE}/list_${NAME_COLL_LOWERCASE}s.ejs')
            },
            methods: {
                get: [ async function(req, res){
                    let { field, value } = req.params;
                    let { ${outputParamsFilter} type } = req.query;

                    let list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_MODEL.getListByFilter({
                        ${outputParamsFilter} [field]: value,
                    });

                    ChildRouter.renderToView(req, res, {
                        list${NAME_COLL_CAPITALIZE}s: list${NAME_COLL_CAPITALIZE}s.data || [],
                        ${outputImportConstant}
                        [field]: value,
                    });
                }]
            },
        },
    `;

    // API GET LIST BY FILTER (SERVER SIDE)
    outputtedFile += `
        /**
         * Function: Get List ${NAME_COLL_CAPITALIZE} Server Side (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}_SERVER_SIDE]: {
            config: {
                scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                post: [ async function(req, res){
                    const { ${!isServerSide ? outputParamsFilter : 'keyword, filter, condition, objFilterStatic, '} start, length, order } = req.body;
					const page = Number(start) / Number(length) + 1;

                    let field, dir;
                    if (order && order.length) {
                        field = req.body.columns[order[0].column].data;
                        dir = order[0].dir;
                    }

                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.getListByFilterServerSide({
                        ${!isServerSide ? outputParamsFilter : 'keyword, filter, condition, objFilterStatic, '} page, limit: length, field, dir
                    });
                    res.json(response);
                }]
            },
        },
    `;

    // API GET LIST BY FILTER IMPORT
    outputtedFile += `
        /**
         * Function: Get List ${NAME_COLL_CAPITALIZE} Import (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}_IMPORT]: {
            config: {
                scopes: [ 'read:list_${NAME_COLL_LOWERCASE}' ],
                type: 'json',
            },
            methods: {
                post: [ async function(req, res){
                    const { keyword, filter, condition, objFilterStatic, start, length } = req.body;
					const page = Number(start) / Number(length) + 1;

                    const response = await ${NAME_COLL_UPPERCASE}_MODEL.getListByFilterImport({
                        keyword, filter, condition, objFilterStatic, page, limit: length
                    });
                    res.json(response);
                }]
            },
        },
    `;

    outputtedFile += `
        /**
         * Function: Get List ${NAME_COLL_CAPITALIZE} Excel Server Side (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
         [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.GET_LIST_${NAME_COLL_UPPERCASE}_EXCEL]: {
            config: {
                scopes: ['read:list_${NAME_COLL_LOWERCASE}'],
                type: 'json',
            },
            methods: {
                post: [async function(req, res) {
                    let {
                        listItemExport,
                        chooseCSV,
                        nameOfParentColl,
                    } = req.body;

                    let conditionObj = ${NAME_COLL_UPPERCASE}_MODEL.getConditionArrayFilterExcel(listItemExport)
                    
                    let response = await MANAGE_COLL_MODEL.insertHistoryExport({ 
                        coll: conditionObj.refParent,
                        list_type_coll: conditionObj.arrayFieldIDChoice,
                        listItemExport,
                        chooseCSV,
                        nameOfParentColl
                    })

                    res.json(response)
                }]
            },
        },
    `;

    outputtedFile += `
        /**
         * Function: Download ${NAME_COLL_CAPITALIZE} Excel Export (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
         [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.DOWNLOAD_LIST_${NAME_COLL_UPPERCASE}_EXCEL_EXPORT]: {
            config: {
                scopes: ['read:list_${NAME_COLL_LOWERCASE}'],
                type: 'json',
            },
            methods: {
                post: [async function(req, res) {
                    let {
                        filter,
                        condition,
                        objFilterStatic,
                        order,
                        keyword,
                        arrayItemChecked
                    } = req.body;

                    let field, dir;
                    if (order && order.length) {
                        field = req.body.columns[order[0].column].data;
                        dir = order[0].dir;
                    }

                    let { listCollChoice: { listItemExport, chooseCSV, nameOfParentColl }} = await MANAGE_COLL_MODEL.getInfo({
                        name: '${NAME_COLL_LOWERCASE}'
                    });

                    let conditionObj = ${NAME_COLL_UPPERCASE}_MODEL.getConditionArrayFilterExcel(listItemExport, filter, condition, objFilterStatic, field, dir, keyword, arrayItemChecked)
                    let response = await ${NAME_COLL_UPPERCASE}_MODEL.getListByFilterExcel({
                        arrayFilter: conditionObj.arrayFilter,
                        arrayItemCustomerChoice: conditionObj.arrayItemCustomerChoice, chooseCSV, nameOfParentColl
                    });

                    res.json(response)
                }]
            },
        },
    `;

    outputtedFile += `
        /**
         * Function: Setting ${NAME_COLL_CAPITALIZE} Excel Import (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.SETTING_FILE_${NAME_COLL_UPPERCASE}_EXCEL_IMPORT_PREVIEW]: {
            config: {
                scopes: ['read:list_${NAME_COLL_LOWERCASE}'],
                type: 'json',
            },
            methods: {
                post: [async function(req, res) {
                    const {
                        listItemImport,
                        condition
                    } = req.body;

                    let conditionObj = ${NAME_COLL_UPPERCASE}_MODEL.getConditionArrayFilterExcel(listItemImport);
                   
                    let response = await MANAGE_COLL_MODEL.insertHistoryImport({ 
                        coll: conditionObj.refParent, 
                        arrayFieldChoice: conditionObj.arrayItemCustomerChoice,
                        listItemImport,
                        condition
                    });
                    res.json(response)
                }]
            },
        },
    `;

    outputtedFile += `
        /**
         * Function: Download ${NAME_COLL_CAPITALIZE} Excel Import (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.DOWNLOAD_FILE_${NAME_COLL_UPPERCASE}_EXCEL_IMPORT]: {
            config: {
                scopes: ['read:list_${NAME_COLL_LOWERCASE}'],
                type: 'json',
            },
            methods: {
                get: [async function(req, res) {
                    let { opts } = req.query;
                    let condition = JSON.parse(opts);

                    let listFieldHistoryImportColl = await MANAGE_COLL_MODEL.getInfoImport({ 
                        name: '${NAME_COLL_LOWERCASE}'
                    });

                    let list${NAME_COLL_CAPITALIZE}Import = await ${NAME_COLL_UPPERCASE}_MODEL.fileImportExcelPreview({
                        arrayItemCustomerChoice: listFieldHistoryImportColl.listCollChoice,
                        opts: condition
                    });

                    res.download(list${NAME_COLL_CAPITALIZE}Import.pathWriteFile, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            // Remove file on server
                            fs.unlinkSync(list${NAME_COLL_CAPITALIZE}Import.pathWriteFile);
                        }    
                    });
                }]
            },
        },
    `;

    outputtedFile += `
        /**
         * Function: Upload ${NAME_COLL_CAPITALIZE} Excel Import (API)
         * Date: ${moment(new Date()).format('DD/MM/YYYY')}
         * Dev: Automatic
         */
        [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.CREATE_${NAME_COLL_UPPERCASE}_IMPORT_EXCEL]: {
            config: {
                scopes: ['create:${NAME_COLL_LOWERCASE}'],
                type: 'json',
            },
            methods: {
                post: [ uploadSingle, async function(req, res) {
                   
                    let listFieldHistoryImportColl = await MANAGE_COLL_MODEL.getInfoImport({ 
                        name: '${NAME_COLL_LOWERCASE}'
                    });

                    let response = await ${NAME_COLL_UPPERCASE}_MODEL.importExcel({
                        arrayItemCustomerChoice: listFieldHistoryImportColl.listCollChoice,
                        file: req.file,
                        nameCollParent: '${NAME_COLL_LOWERCASE}',
                    });

                    res.json(response);
                }]
            },
        },
    `;

    outputtedFile += renderExtendsApi(collectionName, extendsAPI);
    outputtedFile += `
                }
            }
        };
    `;

    return outputtedFile;
}

async function createContentRoute(collectionName, extendsAPI) {
    const NAME_COLL_UPPERCASE = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE = collectionName.toLowerCase();
    let outputExtendsAPI = '';

    if(extendsAPI && extendsAPI.length){
        extendsAPI.map(api => {
            let CONSTANT_ROUTE = '';
            let CONSTANT_ENDPOINT = '';
            let checkPermission = api.authenticate === 'permission' && api.authorize === 'authorize';
            let ENDFIX = checkPermission ? '_OF_ME' : '';
            let ENDFIX_ROUTE = checkPermission ? '-of-me' : '';

            switch (api.method) {
                case 'GET': {
                    if(api.typeGet === 'get-list'){
                        CONSTANT_ROUTE = `API_GET_LIST_${NAME_COLL_UPPERCASE}S${ENDFIX}`;
                        CONSTANT_ENDPOINT = `list-${NAME_COLL_LOWERCASE}s${ENDFIX_ROUTE}`;
                    } else{
                        CONSTANT_ROUTE = `API_GET_INFO_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                        CONSTANT_ENDPOINT = `info-${NAME_COLL_LOWERCASE}${ENDFIX_ROUTE}/:${NAME_COLL_LOWERCASE}ID`;
                    }

                    if(!api.endpoint){
                        outputExtendsAPI += `${CONSTANT_ROUTE}: ${'`${API_BASE_ROUTE}'}/${CONSTANT_ENDPOINT}\`,`;
                    } else{
                        outputExtendsAPI += `${CONSTANT_ROUTE}: '${api.endpoint}',`;
                    }
                    break;
                }
                case 'POST': {
                    if(api.typePost === 'create-many'){
                        CONSTANT_ROUTE = `API_ADD_${NAME_COLL_UPPERCASE}S${ENDFIX}`;
                        CONSTANT_ENDPOINT = `add-${NAME_COLL_LOWERCASE}s${ENDFIX_ROUTE}`;
                    } else{
                        CONSTANT_ROUTE = `API_ADD_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                        CONSTANT_ENDPOINT = `add-${NAME_COLL_LOWERCASE}${ENDFIX_ROUTE}`;
                    }

                    if(!api.endpoint){
                        outputExtendsAPI += `${CONSTANT_ROUTE}: ${'`${API_BASE_ROUTE}'}/${CONSTANT_ENDPOINT}\`,`;
                    } else{
                        outputExtendsAPI += `${CONSTANT_ROUTE}: '${api.endpoint}',`;
                    }
                    break;
                }
                case 'PUT': {
                    CONSTANT_ROUTE = `API_UPDATE_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                    CONSTANT_ENDPOINT = `update-${NAME_COLL_LOWERCASE}${ENDFIX_ROUTE}/:${NAME_COLL_LOWERCASE}ID`;

                    if(!api.endpoint){
                        outputExtendsAPI += `${CONSTANT_ROUTE}: ${'`${API_BASE_ROUTE}'}/${CONSTANT_ENDPOINT}\`,`;
                    } else{
                        outputExtendsAPI += `${CONSTANT_ROUTE}: '${api.endpoint}',`;
                    }
                    break;
                }
                case 'DELETE': {
                    if(api.typeDelete === 'delete-many'){
                        CONSTANT_ROUTE = `API_DELETE_${NAME_COLL_UPPERCASE}S${ENDFIX}`;
                        CONSTANT_ENDPOINT = `delete-${NAME_COLL_LOWERCASE}s${ENDFIX_ROUTE}/:${NAME_COLL_LOWERCASE}sID`;
                    } else{
                        CONSTANT_ROUTE = `API_DELETE_${NAME_COLL_UPPERCASE}${ENDFIX}`;
                        CONSTANT_ENDPOINT = `delete-${NAME_COLL_LOWERCASE}${ENDFIX_ROUTE}/:${NAME_COLL_LOWERCASE}ID`;
                    }

                    if(!api.endpoint){
                        outputExtendsAPI += `${CONSTANT_ROUTE}: ${'`${API_BASE_ROUTE}'}/${CONSTANT_ENDPOINT}\`,`;
                    } else{
                        outputExtendsAPI += `${CONSTANT_ROUTE}: '${api.endpoint}',`;
                    }
                    break;
                }
                default:
                    break;
            }

        })
    }

    const nameAPI   = `api-${NAME_COLL_LOWERCASE.replaceAll('_', '-')}`;
    const endpoint  = `/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}`;

    const infoAPI   = await API_MANAGEMENT__MODEL.getInfoByCondition({ name: nameAPI });

    if(infoAPI.error){
        await API_MANAGEMENT__MODEL.insert({
            name: nameAPI,
            endpoint
        });
    }

    let BASE_ROUTE = '`${BASE_ROUTE}';
    let outputtedFile = `
        const BASE_ROUTE = '/${NAME_COLL_LOWERCASE}';
        const API_BASE_ROUTE = '/api/${NAME_COLL_LOWERCASE}';

        const CF_ROUTINGS_${NAME_COLL_UPPERCASE} = {
            ADD_${NAME_COLL_UPPERCASE}: ${BASE_ROUTE}/add-${NAME_COLL_LOWERCASE}\`,
            UPDATE_${NAME_COLL_UPPERCASE}_BY_ID: ${BASE_ROUTE}/update-${NAME_COLL_LOWERCASE}-by-id\`,
            DELETE_${NAME_COLL_UPPERCASE}_BY_ID: ${BASE_ROUTE}/delete/:${NAME_COLL_LOWERCASE}ID\`,

            GET_INFO_${NAME_COLL_UPPERCASE}_BY_ID: ${BASE_ROUTE}/info/:${NAME_COLL_LOWERCASE}ID\`,
            GET_LIST_${NAME_COLL_UPPERCASE}: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}\`,
            GET_LIST_${NAME_COLL_UPPERCASE}_BY_FIELD: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}/:field/:value\`,
            GET_LIST_${NAME_COLL_UPPERCASE}_SERVER_SIDE: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}-server-side\`,

            UPDATE_${NAME_COLL_UPPERCASE}_NOT_REQUIRE_BY_ID: ${BASE_ROUTE}/update-${NAME_COLL_LOWERCASE}-by-id-v2\`,
            DELETE_${NAME_COLL_UPPERCASE}_BY_LIST_ID: ${BASE_ROUTE}/delete-${NAME_COLL_LOWERCASE}-by-list-id\`,

            // EXPORT EXCEL
            GET_LIST_${NAME_COLL_UPPERCASE}_EXCEL: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}-excel\`,
            DOWNLOAD_LIST_${NAME_COLL_UPPERCASE}_EXCEL_EXPORT: ${BASE_ROUTE}/dowload-${NAME_COLL_LOWERCASE}-excel-export\`,

            // IMPORT EXCEL
            GET_LIST_${NAME_COLL_UPPERCASE}_IMPORT: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}-import\`,
            SETTING_FILE_${NAME_COLL_UPPERCASE}_EXCEL_IMPORT_PREVIEW: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}-import-setting\`,
            DOWNLOAD_FILE_${NAME_COLL_UPPERCASE}_EXCEL_IMPORT: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}-import-dowload\`,
            CREATE_${NAME_COLL_UPPERCASE}_IMPORT_EXCEL: ${BASE_ROUTE}/create-${NAME_COLL_LOWERCASE}-import-excel\`,

            ${outputExtendsAPI}

            ORIGIN_APP: BASE_ROUTE,
        }

        exports.CF_ROUTINGS_${NAME_COLL_UPPERCASE} = CF_ROUTINGS_${NAME_COLL_UPPERCASE};
    `;

    return outputtedFile;
}

function appendContentConfigConstant(fields, collectionName) {
    let outputContentConstantEnum = '';

    fields.map(field => {
        let input = field.input;

        if(check.isTrue(input.isEnum)){
            let outputCommentEnum   = '';
            let outputConstantEnum  = '';

            input.dataEnum.map(item => {
                outputCommentEnum += `\n* ${item.value}: ${item.title}`;
                outputConstantEnum += `
                    "${item.value}": {
                        value: "${item.title}",
                        color: "${item.color}"
                    },
                `;
            })

            outputContentConstantEnum += `
                /**
                 * ${input.note} ${outputCommentEnum}
                 */
                exports.${input.name.toUpperCase()}_${collectionName.toUpperCase()}_TYPE = {
                    ${outputConstantEnum}
                };
            `;
        }
    });

    return outputContentConstantEnum;
}

module.exports.generateApi = (collectionName, collectionDescription, fields, fieldsExcept, pathSave, isServerSide, folderName, extendsAPI, isSystemConfig) => {
    return new Promise(async resolve => {
        let outputtedFileConstant   = await createContentRoute(collectionName, extendsAPI);
        let outputtedFileApi        = await createContentApi(fields, fieldsExcept, collectionName, isServerSide, pathSave, folderName, extendsAPI, isSystemConfig);

        try {
            let fileName = pathSave;
            outputtedFileConstant   = beautifyerJS(outputtedFileConstant);
            outputtedFileApi        = beautifyerJS(outputtedFileApi);

            fs.access(fileName, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                    logger.error(err);
                    return resolve({
                        error: true,
                        message: `Can't access path ${fileName} or permission denined`
                    });
                }

                fileName += `/www/packages/${folderName.toLowerCase()}`;

                const fileNameConstant  = `${fileName}/constants/${collectionName.toLowerCase()}/${collectionName.toLowerCase()}.uri.js`;
                const fileNameApi       = `${fileName}/apis/${collectionName.toLowerCase()}.js`;

                if(!fs.existsSync(fileName)){
                    fs.mkdirSync(fileName);
                }

                if(!fs.existsSync(`${fileName}/apis`)){
                    fs.mkdirSync(`${fileName}/apis`);
                }

                if(!fs.existsSync(`${fileName}/constants`)){
                    fs.mkdirSync(`${fileName}/constants`);
                }

                if(!fs.existsSync(`${fileName}/constants/${collectionName.toLowerCase()}`)){
                    fs.mkdirSync(`${fileName}/constants/${collectionName.toLowerCase()}`);
                }

                fs.writeFile(fileNameConstant, outputtedFileConstant, (err) => {
                    if (err) {
                        logger.error(err);
                        return resolve({ error: true, message: err });
                    }
                    log(chalk.green(`Create constants success!! in the directory ${fileNameConstant}`));

                    if(pathSave.endsWith("/") || pathSave.endsWith("\\")){
                        pathSave = pathSave.slice(0, -1);
                    }

                    fs.writeFile(fileNameApi, outputtedFileApi, (err) => {
                        if (err) {
                            logger.error(err);
                            return resolve({ error: true, message: err });
                        }

                        let outputContentConfigConstant = appendContentConfigConstant(fields, collectionName);
                        let pathFileConfigConstant      = `${fileName}/constants/${collectionName.toLowerCase()}/index.js`;
                        fs.writeFileSync(pathFileConfigConstant, beautifyerJS(outputContentConfigConstant));

                        log(chalk.green(`Create apis success!! in the directory ${fileNameApi}`));
                        resolve({
                            error: false,
                            message: `Create apis success!! in the directory ${fileNameApi}`
                        });
                    });

                });

            });
        } catch (error) {
            logger.error(error);
            resolve(error);
        }
    })
}
