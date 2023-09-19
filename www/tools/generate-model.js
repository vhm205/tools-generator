const check                 = require('./module/check');
const beautifyer            = require('js-beautify').js_beautify;
const pluralize             = require('pluralize');
const fs                    = require('fs');
const chalk                 = require('chalk');
const logger		        = require('../config/logger/winston.config');
const log                   = console.log;

const MANAGE__COLL_COLL     = require('../database/manage_coll-coll');
const TYPE__COLL_COLL       = require('../database/type_coll-coll');

function renderExtendsModel(collectionName, extendsAPI = []) {
    const NAME_COLL_UPPERCASE   = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE   = collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE 	= collectionName.toCapitalize();

    let outputHtmlExtendsModel  = '';

    extendsAPI.map(api => {
        let funcName        = '';
        let params          = '';
        let inputs          = [];
        let inputsPopulate  = [];

        let outputAnnotating    = '';
        let outputValidateInput = '';
        let outputFieldUpdate   = '';
        let outputParamsFilter  = '';
        let outputFilterSearch  = '';
        let outputSortOrder     = '';
        let permissionAuthor    = { get: '', set: '' };
        let isNeedPermission    = api.authenticate === 'permission';

        if(isNeedPermission) {
            permissionAuthor = {
                get: ', authorID',
                set: ', author: authorID',
            }
        }

        if(api.method === 'POST' || api.method === 'PUT' || api.method === 'GET'){

            if(api.fieldsPopulate && api.fieldsPopulate.length){
                api.fieldsPopulate.map(field => inputsPopulate = [...inputsPopulate, field]);
            }

            api.fields && api.fields.map(row => {
                const input = row.input;

                params += `${input.name}, `;

                switch (input.type) {
                    case 'text':
                        outputAnnotating += `\t* @param {string} ${input.name}\n`;
                        break;
                    case 'number':
                        if(check.isTrue(input.isEnum)){
                            inputs = [...inputs, input.name];
                            outputParamsFilter += `${input.name}, `;
                            outputFilterSearch += `
                                ${input.name} && (conditionObj.${input.name} = ${input.name});
                            `;
                        }

                        if(check.isTrue(input.isCurrency)){
                            inputs = [...inputs, `${input.name}FromNumber`, `${input.name}ToNumber`];
                            outputParamsFilter += `${input.name}FromNumber, ${input.name}ToNumber, `;
                            outputFilterSearch += `
                                if(${input.name}FromNumber && ${input.name}ToNumber){
                                    conditionObj.${input.name} = {
                                        $gte: ${input.name}FromNumber,
                                        $lte: ${input.name}ToNumber,
                                    };
                                }
                            `;
                        }
                        break;
                    case 'date':
                        inputs = [...inputs, `${input.name}DateRange`];
                        outputParamsFilter += `${input.name}DateRange, `;
                        outputFilterSearch += `
                            if(${input.name}DateRange){
                                let [fromDate, toDate] = ${input.name}DateRange.split('-');
                                let _fromDate   = moment(fromDate.trim()).startOf('day').format();
                                let _toDate     = moment(toDate.trim()).endOf('day').format();

                                conditionObj.${input.name} = {
                                    $gte: new Date(_fromDate),
                                    $lte: new Date(_toDate)
                                }
                            }
                        `;
                        break;
                    case 'object':
                        if(input.ref){
                            inputs = [...inputs, input.name];
                            outputParamsFilter += `${input.name}, `;
                            outputFilterSearch += `
                                ${input.name} && (conditionObj.${input.name} = ${input.name});
                            `;
                        }
                        break;
                    case 'array':
                        if(input.ref){
                            inputs = [...inputs, input.name];
                            outputParamsFilter += `${input.name}, `;
                            outputFilterSearch += `
                                if(${input.name} && ${input.name}.length){
                                    conditionObj.${input.name} = { $in: ${input.name} };
                                }
                            `;
                        }
                        break;
                    default:
                        outputAnnotating += `\t* @param {${input.type}} ${input.name}\n`;
                        break;
                }

                if(input.type === 'array' || input.type === 'object'){
                    if(input.ref){
                        outputValidateInput += `
                            if(${input.name} && !checkObjectIDs(${input.name})) {
                                return resolve({ error: true, message: '${input.note || input.name} không hợp lệ', status: 400 });
                            }
                        `;
                    } else{
                        if(input.type === 'array'){
                            outputValidateInput += `
                                if(${input.name} && !${input.name}.length) {
                                    return resolve({ error: true, message: 'Bạn cần nhập ${input.note || input.name}', status: 400 });
                                }
                            `;
                        }

                        if(input.type === 'object'){
                            outputValidateInput += `
                                if(${input.name} && isEmptyObj(${input.name})) {
                                    return resolve({ error: true, message: 'Bạn cần nhập ${input.note || input.name}', status: 400 });
                                }
                            `;
                        }
                    }
                }

                // Output field enum
                if(check.isTrue(input.isEnum)){
                    if(input.type === 'text'){
                        outputValidateInput += `
                            if(${input.name} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                return resolve({ error: true, message: '${input.note || input.name} không hợp lệ', status: 400 });
                            }
                        `;
                    }

                    if(input.type === 'number'){
                        outputValidateInput += `
                            if(${input.name} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                return resolve({ error: true, message: '${input.note || input.name} không hợp lệ', status: 400 });
                            }
                        `;
                    }
                }

                if(check.isTrue(input.isOrder)){
                    outputSortOrder = `
                        sort = { ${input.name}: 1, modifyAt: -1 };
                    `;
                }

                if(input.name === 'phone'){
                    outputValidateInput = `
                        if(${input.name} && !checkPhoneNumber(${input.name})) {
                            return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                        }
                    `;
                }

                if(input.name === 'email'){
                    outputValidateInput = `
                        if(${input.name} && !checkEmail(${input.name})) {
                            return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                        }
                    `;
                }

                if(input.type === 'date'){
                    outputFieldUpdate += `${input.name} && (dataUpdate.${input.name} = new Date(${input.name}));`;
                } else{
                    outputFieldUpdate += `${input.name} && (dataUpdate.${input.name} = ${input.name});`;
                }

                if(check.isTrue(input.isSlug)){
                    outputFieldUpdate += `${input.name} && (dataUpdate.${input.name} = convertToSlug(${input.name}));`;
                }

            })
        }

        switch (api.method) {
            case 'GET': {
                if(api.typeGet === 'get-list'){
                    outputHtmlExtendsModel += `
                        /**
                         * ${api.note ? api.note : `Lấy danh sách ${NAME_COLL_LOWERCASE}`}
                         * @param {object} filter
                         * @param {object} sort
                         * @param {string} explain
                         * @param {string} select
                         * @param {string} search
                         * @param {number} limit
                         * @param {number} page
                         * @extends {BaseModel}
                         * @returns {{ 
                         *   error: boolean, 
                         *   data?: {
                         *      records: array,
                         *      totalRecord: number,
                         *      totalPage: number,
                         *      limit: number,
                         *      page: number
                         *   },
                         *   message?: string,
                         *   status: number
                         * }}
                         */
                        getList${NAME_COLL_CAPITALIZE}s({ search, select, explain, filter = {}, sort = {}, limit = 25, page${permissionAuthor.get} }) {
                            return new Promise(async resolve => {
                                try {
                                    let conditionObj = { state: 1 };
                                    let sortBy  = {};
                                    let objSort = {};
                                    let fieldsSelected   = '';
                                    let fieldsReference  = [];

                                    limit = isNaN(limit) ? 25 : +limit;
                                    page = isNaN(page) ? 1 : +page;

                                    if(filter && typeof filter === 'string'){
                                        if(!IsJsonString(filter))
                                            return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

                                        filter = JSON.parse(filter);
                                    }

                                    if(sort && typeof sort === 'string'){
                                        if(!IsJsonString(sort))
                                            return resolve({ error: true, message: 'Request params sort invalid', status: 400 });

                                        sort = JSON.parse(sort);
                                    } else {
                                        ${outputSortOrder}
                                    }

                                    // SEARCH TEXT
                                    if(search){
                                        conditionObj.$text = { $search: search };
                                        objSort.score = { $meta: "textScore" };
                                        sortBy.score  = { $meta: "textScore" };
                                    }

                                    Object.keys(filter).map(key => {
                                        if(![${inputs.map(inp => `'${inp}'`)}].includes(key)){
                                          delete filter[key];
                                        }
                                    });

                                    let { ${outputParamsFilter} } = filter;
                                    ${outputFilterSearch}

                                    if(explain){
                                        explain = explain.split(',');

                                        explain.map((populate, index) => {
                                            let [ref] = populate.split('__');

                                            if (![${inputsPopulate.map(field => `'${field}'`)}].includes(ref)) {
                                                explain.splice(index, 1);
                                            } else{
                                                fieldsReference = [...fieldsReference, {
                                                    path: ref
                                                }]
                                            }
                                        })
                                    }

                                    if(select){
                                        select = select.split(',');
                                        fieldsReference = [];

                                        select.map((fieldSelect, index) => {
                                            let refField = fieldSelect.split('__');
                    
                                            if(refField.length === 2){
                                                if (explain && !explain.includes(refField[0])) {
                                                    select.splice(index, 1);
                                                } else{
                                                    fieldsReference = [...fieldsReference, {
                                                        path: refField[0],
                                                        select: refField[1]
                                                    }]
                                                }
                                            } else{
                                                if (explain && explain.includes(refField[0])) {
                                                    fieldsReference = [...fieldsReference, {
                                                        path: refField[0],
                                                    }]
                                                }

                                                fieldsSelected += ${'`${fieldSelect} `'};
                                            }

                                        })
                                    }

                                    let list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_COLL
                                        .find({ ...conditionObj${permissionAuthor.set} }, objSort)
                                        .select(fieldsSelected)
                                        .limit(limit)
                                        .skip((page * limit) - limit)
                                        .sort({ ...sort, ...sortBy })
                                        .lean()

                                    if(fieldsReference && fieldsReference.length){
                                        fieldsReference = lodash.chain(fieldsReference)
                                            .groupBy("path")
                                            .map((select, path) => ({ path, select: select.map(item => item.select).join(' ') }))
                                            .value();

                                        for (const refObj of fieldsReference) {
                                            list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_COLL.populate(list${NAME_COLL_CAPITALIZE}s, {
                                                path: refObj.path,
                                                select: refObj.select,
                                            })
                                        }

                                        for (const populate of explain) {
                                            let [ref, field] = populate.split('__');

                                            if(field){
                                                list${NAME_COLL_CAPITALIZE}s = await ${NAME_COLL_UPPERCASE}_COLL.populate(list${NAME_COLL_CAPITALIZE}s, ${'`${ref}.${field}`'});
                                            }
                                        }
                                    }

                                    if(!list${NAME_COLL_CAPITALIZE}s){
                                        return resolve({ error: true, message: 'Không thế lâý danh sách ${NAME_COLL_LOWERCASE}', status: 400 });
                                    }

                                    let totalRecord = await ${NAME_COLL_UPPERCASE}_COLL.countDocuments(conditionObj);
                                    let totalPage = Math.ceil(totalRecord / limit);

                                    return resolve({ 
                                        error: false,
                                        data: {
                                            records: list${NAME_COLL_CAPITALIZE}s,
                                            totalRecord,
                                            totalPage,
                                            limit,
                                            page
                                        },
                                        status: 200
                                    });
                                } catch (error) {
                                    console.error(error);
                                    return resolve({ error: true, message: error.message, status: 500 });
                                }
                            })
                        }
                    `;
                } else{
                    outputHtmlExtendsModel += `
                        /**
                         * ${api.note ? api.note : `Lấy thông tin ${NAME_COLL_LOWERCASE}`}
                         * @param {objectId} ${NAME_COLL_LOWERCASE}ID
                         * @extends {BaseModel}
                         * @returns {{ error: boolean, data?: object, message?: string }}
                         */
                        getInfo${NAME_COLL_CAPITALIZE}({ ${NAME_COLL_LOWERCASE}ID, select, filter = {}, explain${permissionAuthor.get} }) {
                            return new Promise(async resolve => {
                                try {
                                    let fieldsSelected   = '';
                                    let fieldsReference  = [];
                                    let conditionObj     = { state: 1 };

                                    if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID])){
                                        return resolve({ error: true, message: 'Giá trị ${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                                    }

                                    if(filter && typeof filter === 'string'){
                                        if(!IsJsonString(filter))
                                            return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

                                        filter = JSON.parse(filter);
                                    }

                                    Object.keys(filter).map(key => {
                                        if(![${inputs.map(inp => `'${inp}'`)}].includes(key)){
                                          delete filter[key];
                                        }
                                    });

                                    let { ${outputParamsFilter} } = filter;
                                    ${outputFilterSearch}

                                    if(explain){
                                        explain = explain.split(',');

                                        explain.map((populate, index) => {
                                            let [ref] = populate.split('__');

                                            if (![${inputsPopulate.map(field => `'${field}'`)}].includes(ref)) {
                                                explain.splice(index, 1);
                                            } else{
                                                fieldsReference = [...fieldsReference, {
                                                    path: ref
                                                }]
                                            }
                                        })
                                    }

                                    if(select){
                                        select = select.split(',');
                                        fieldsReference = [];

                                        select.map((fieldSelect, index) => {
                                            let refField = fieldSelect.split('__');

                                            if(refField.length === 2){
                                                if (explain && !explain.includes(refField[0])) {
                                                    select.splice(index, 1);
                                                } else{
                                                    fieldsReference = [...fieldsReference, {
                                                        path: refField[0],
                                                        select: refField[1]
                                                    }]
                                                }
                                            } else{
                                                if (explain && explain.includes(refField[0])) {
                                                    fieldsReference = [...fieldsReference, {
                                                        path: refField[0],
                                                    }]
                                                }

                                                fieldsSelected += ${'`${fieldSelect} `'};
                                            }

                                        })
                                    }

                                    let info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL
                                        .findOne({ _id: ${NAME_COLL_LOWERCASE}ID, ...conditionObj${permissionAuthor.set} })
                                        .select(fieldsSelected)
                                        .lean();

                                    if(fieldsReference && fieldsReference.length){
                                        fieldsReference = lodash.chain(fieldsReference)
                                            .groupBy("path")
                                            .map((select, path) => ({ path, select: select.map(item => item.select).join(' ') }))
                                            .value();

                                        for (const refObj of fieldsReference) {
                                            info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL.populate(info${NAME_COLL_CAPITALIZE}, {
                                                path: refObj.path,
                                                select: refObj.select,
                                            })
                                        }

                                        for (const populate of explain) {
                                            let [ref, field] = populate.split('__');

                                            if(field){
                                                info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL.populate(info${NAME_COLL_CAPITALIZE}, ${'`${ref}.${field}`'});
                                            }
                                        }
                                    }

                                    if(!info${NAME_COLL_CAPITALIZE}){
                                        return resolve({ error: true, message: 'Không thế lâý thông tin ${NAME_COLL_LOWERCASE}', status: 400 });
                                    }

                                    return resolve({ error: false, data: info${NAME_COLL_CAPITALIZE}, status: 200 });
                                } catch (error) {
                                    console.error(error);
                                    return resolve({ error: true, message: error.message, status: 500 });
                                }
                            })
                        }
                    `;
                }
                break;
            }
            case 'POST': {
                if(api.typePost === 'create-many'){
                    funcName = `insert${NAME_COLL_CAPITALIZE}s`;
                } else{
                    funcName = `insert${NAME_COLL_CAPITALIZE}`;
                }

                outputHtmlExtendsModel += `
                    /**
                     * ${api.note ? api.note : `Tạo ${NAME_COLL_LOWERCASE}`}
                     ${outputAnnotating}
                     * @param {objectId} authorID
                     * @this {BaseModel}
                     * @extends {BaseModel}
                     * @returns {{ error: boolean, data?: object, message?: string }}
                     */
                    ${funcName}({ ${api.typePost === 'create-many' ? 'fields,' : params} authorID }) {
                        return new Promise(async resolve => {
                            try {
                                if(!checkObjectIDs([authorID]))
                                    return resolve({ error: true, message: 'Người tạo không hợp lệ', status: 400 });

                                ${api.typePost === 'create-many' ? (`
                                    for (const field of fields) {
                                        let { ${params} } = field;
                                        ${outputValidateInput}
                                    }
                                    let infoAfterInsert = await ${NAME_COLL_UPPERCASE}_COLL.insertMany(fields);
                                `) : (`
                                    ${outputValidateInput}
                                    let dataInsert = { ${params} author: authorID };
                                    dataInsert = cleanObject(dataInsert);
                                    let infoAfterInsert = await this.insertData(dataInsert);
                                `)}

                                if(!infoAfterInsert){
                                    return resolve({ error: true, message: 'Tạo ${NAME_COLL_UPPERCASE} thất bại', status: 400 });
                                }

                                return resolve({ error: false, data: infoAfterInsert, status: 200 });
                            } catch (error) {
                                console.error(error);
                                return resolve({ error: true, message: error.message, status: 500 });
                            }
                        })
                    }
                `;
                break;
            }
            case 'PUT': {
                funcName = `update${NAME_COLL_CAPITALIZE}`;

                outputHtmlExtendsModel += `
                    /**
                     * ${api.note ? api.note : `Cập nhật ${NAME_COLL_LOWERCASE}`}
                     ${outputAnnotating}
                     * @param {objectId} ${NAME_COLL_LOWERCASE}ID
                     * @param {objectId} authorID
                     * @this {BaseModel}
                     * @extends {BaseModel}
                     * @returns {{ error: boolean, data?: object, message?: string }}
                     */
                    ${funcName}({ ${NAME_COLL_LOWERCASE}ID, ${params} authorID }) {
                        return new Promise(async resolve => {
                            try {
                                if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID]))
                                    return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });

                                if(!checkObjectIDs([authorID]))
                                    return resolve({ error: true, message: 'ID user cập nhật không hợp lệ', status: 400 });

                                ${outputValidateInput}
                                const checkExists = await ${NAME_COLL_UPPERCASE}_COLL.findOne({ _id: ${NAME_COLL_LOWERCASE}ID, state: 1 });
                                if(!checkExists){
                                    return resolve({ error: true, message: '${NAME_COLL_LOWERCASE} không tồn tại', status: 404 });
                                }

                                let dataUpdate = { userUpdate: authorID };
                                ${outputFieldUpdate}
                                let infoAfterUpdate = await this.findOneAndUpdate({ _id: ${NAME_COLL_LOWERCASE}ID }, dataUpdate);

                                if(!infoAfterUpdate){
                                    return resolve({ error: true, message: 'Cập nhật thất bại', status: 400 });
                                }

                                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
                            } catch (error) {
                                console.error(error);
                                return resolve({ error: true, message: error.message, status: 500 });
                            }
                        })
                    }
                `;
                break;
            }
            case 'DELETE': {
                if(api.typeDelete === 'delete-many'){
                    funcName = `delete${NAME_COLL_CAPITALIZE}s`;
                    params  = `${NAME_COLL_LOWERCASE}sID`;
                } else{
                    funcName = `delete${NAME_COLL_CAPITALIZE}`;
                    params = `${NAME_COLL_LOWERCASE}ID`;
                }

                if(api.endpoint){
                    let index = api.endpoint.lastIndexOf(':');
                    params = api.endpoint.substr(index + 1, api.endpoint.length);
                }

                outputHtmlExtendsModel += `
                    /**
                     * ${api.note ? api.note : `Xóa ${NAME_COLL_LOWERCASE}`}
                     * @param {objectId} ${NAME_COLL_LOWERCASE}ID
                     * @this {BaseModel}
                     * @extends {BaseModel}
                     * @returns {{ error: boolean, data?: object, message?: string }}
                     */
                    ${funcName}(${params}${permissionAuthor.get}) {
                        return new Promise(async resolve => {
                            try {
                                ${api.typeDelete === 'delete-many' ? (
                                    `let ids = ${params}.split(',');`
                                ) : (
                                    `let ids = [${params}];`
                                )}

                                if(!checkObjectIDs(ids)){
                                    return resolve({ error: true, message: 'Giá trị ${params} không hợp lệ', status: 400 });
                                }

                                const infoAfterDelete = await this.deleteMany({ _id: { $in: ids }${permissionAuthor.set} });

                                return resolve({ error: false, data: infoAfterDelete, status: 204 });
                            } catch (error) {
                                console.error(error);
                                return resolve({ error: true, message: error.message, status: 500 });
                            }
                        })
                    }
                `;
                break;
            }
            default:
                break;
        }
    })

    return outputHtmlExtendsModel;
}

function generateTableView(fields, collectionName, isApiAddress) {
	const NAME_COLL_UPPERCASE = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE = collectionName.toLowerCase();

    let outputRowTable = '';
    let isColumnFirst  = true;

	fields.map(field => {
        const input = field.input;

        if(check.isTrue(input.isShowList)){
			const inputType = input.type;
			const inputName = input.name;

            switch (inputType) {
                case "text":
                case "number":
                case "date":
                case "boolean":

                    let linkUpdatePage = '`' + `<a href="/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=${'${' + `${NAME_COLL_LOWERCASE}`}._id}">`;

                    if(check.isTrue(input.isCurrency)){
                        outputRowTable += `${inputName}: formatCurrency('###,###.', ${NAME_COLL_LOWERCASE}.${inputName}),`;
                    }
                    else if(input.formatDate){
						outputRowTable += `${inputName}: moment(${NAME_COLL_LOWERCASE}.${inputName}).format("${input.formatDate}"),`;
                    }
                    else if(check.isTrue(input.isEnum)){
                        if (check.isTrue(input.isStatus)) {
                            outputRowTable += `${inputName}: ` +
                            '` <td> <div class="form-check form-switch form-switch-success"><input class="form-check-input check-'+inputName+'" _'+NAME_COLL_LOWERCASE+'ID="${'+NAME_COLL_LOWERCASE+'._id}" type="checkbox" id="${'+NAME_COLL_LOWERCASE+'._id}" ${'+inputName+'} style="width: 40px;height: 20px;"></div></td>`,';
                        } else {
                            const constantColor = `${inputName.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${inputName}].color`;
                            const constantValue = `${inputName.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${inputName}].value`;

                            outputRowTable += `${inputName}: ` + '`<span class="badge" style="background-color: ${' + constantColor + '}">';
                            outputRowTable += '${' + constantValue + '} </span>`,';
                        }
                    } else if (check.isTrue(input.isOrder)) {
                        outputRowTable += `${inputName}: ` + '`<td><input type="number" _'+NAME_COLL_LOWERCASE+'ID="${'+NAME_COLL_LOWERCASE+'._id}" class="form-control change-'+inputName+'" value="${'+inputName+'}"></td>`, ';
                    } else if (check.isTrue(input.isApiAddress)) {
                        // API ADDRESS SHOW LIST TABLE

                    } else {
						let fieldName = `${NAME_COLL_LOWERCASE}.${inputName}`;
						let content   = '${' + fieldName + ' && ' + fieldName + '.length > 50 ? ' + fieldName + '.substr(0,50) + "..." : ' + fieldName + '}';

                        // Font Style
                        if(check.isTrue(input.isBold) && check.isTrue(input.isItalic)){
                            let formatContent = '`<b> <i>' + content + '</i> </b>`,';
                            let formatContentWithLink = linkUpdatePage + '<b> <i>' + content + '</i> </b> </a>`,';

                            outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                        } else{
                            if(check.isTrue(input.isBold)){
                                let formatContent = '`<b>' + content + '</b>`,';
                                let formatContentWithLink = linkUpdatePage + '<b>' + content + '</b> </a>`,';

                                outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                            } else if(check.isTrue(input.isItalic)){
                                let formatContent = '`<i>' + content + '</i>`,';
                                let formatContentWithLink = linkUpdatePage + '<i>' + content + '</i> </a>`,';

                                outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                            } else{
                                outputRowTable += `${inputName}: ${isColumnFirst ? (`
                                    ${linkUpdatePage}${content} </a>${'`'},
                                `) : '`' + content + '`,'}`;
                            }
                        }
                    }

                    break;
                case 'object':

                    if(input.ref){
						let fieldName = `${NAME_COLL_LOWERCASE}.${inputName}`;

                        if(check.isTrue(input.isImage)){
                            let styleImage = 'thumb-xxl rounded';
                            switch (+input.typeImage) {
                                case 1:
                                    styleImage = "thumb-xxl rounded-circle";
                                    break;
                                case 2:
                                    styleImage = "thumb-xxl rounded";
                                    break;
                                case 3:
                                    styleImage = "thumb-xxl img-thumbnail";
                                    break;
                                default:
                                    break;
                            }

							outputRowTable += `${inputName}: ` + '`${' + fieldName + ' ? `<a class="user-avatar me-2 fancybox" href="${' + fieldName + '.path}">';
							outputRowTable += '<img src="${' + fieldName + '.path}" alt="" class="' + styleImage + '"> </a>` : ""}`,';

                        } else if (check.isTrue(input.isLink)) {
                            let fieldRefID = '${' + fieldName + ' && ' + fieldName + '._id}';
                            let fieldRefShow = '${' + fieldName + ' ? ' + fieldName + '.' + input.refShow + ' : "không tồn tại hoặc đã xoá"}';

                            outputRowTable += `${inputName}: ${'`<a class="btn btn-outline-primary" style="padding: 2px 10px" href="/'}${input.ref}/update-${input.ref}-by-id?${input.ref}ID=${fieldRefID}"> ${fieldRefShow} </a>${'`,'}`
                        } else{
							outputRowTable += `${inputName}: ${fieldName} 
                                ? ${fieldName}.${input.refShow}
                                : '<span class="badge bg-danger"> <span class="badge bg-danger"> không tồn tại hoặc đã xoá </span> </span>',`;
                        }
                    }

                    break;
                default:
                    break;
            }
        }
        
        isColumnFirst = false;
    })

    let apiAddress = '';
    if (isApiAddress) {
        apiAddress = `address: ${NAME_COLL_LOWERCASE}.wardName + ", " + ${NAME_COLL_LOWERCASE}.districtName + ", " + ${NAME_COLL_LOWERCASE}.cityName,`;
    }

    let tdIndex = '`<td class="text-center"><div class="checkbox checkbox-success text-center"><input id="${'+NAME_COLL_LOWERCASE+'._id}" type="checkbox" class="check-record check-record-${'+NAME_COLL_LOWERCASE+'._id}" _index ="${index + 1}"><label for="${'+NAME_COLL_LOWERCASE+'._id}"></label></div></td>`';

	return `{
		index: ${tdIndex},
        indexSTT: skip + index + 1,
		${outputRowTable}
        ${apiAddress ? apiAddress : ''}
		createAt: moment(${NAME_COLL_LOWERCASE}.createAt).format('HH:mm DD/MM/YYYY'),
	}`;
}

function generateTableSubView(fields, collectionName) {
	const NAME_COLL_UPPERCASE = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE = collectionName.toLowerCase();

    let outputRowTable = '';
    let isColumnFirst  = true;

	fields.map(input => {

        if(input.isShowList){
			const inputType = input.type;
			const inputName = input.name;

            switch (inputType) {
                case "text":
                case "number":
                case "date":
                case "boolean":

                    let linkUpdatePage = '`' + `<a href="/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=${'${' + `${NAME_COLL_LOWERCASE}`}._id}">`;

                    if(input.isCurrency){
                        outputRowTable += `${inputName}: formatCurrency('###,###.', ${NAME_COLL_LOWERCASE}.${inputName}),`;
                    }
                    else if(input.formatDate){
						outputRowTable += `${inputName}: moment(${NAME_COLL_LOWERCASE}.${inputName}).format("${input.formatDate}"),`;
                    }
                    else if(input.isEnum){
                        const constantColor = `${inputName.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${inputName}].color`;
                        const constantValue = `${inputName.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${inputName}].value`;

                        outputRowTable += `${inputName}: ` + '`<span class="badge" style="background-color: ${' + constantColor + '}">';
                        outputRowTable += '${' + constantValue + '} </span>`,';
                    } else{

                        if(!input.isOrder){
                            let fieldName = `${NAME_COLL_LOWERCASE}.${inputName}`;
                            let content   = '${' + fieldName + ' && ' + fieldName + '.length > 50 ? ' + fieldName + '.substr(0,50) + "..." : ' + fieldName + '}';
    
                            // Font Style
                            if(input.isBold && input.isItalic){
                                let formatContent = '`<b> <i>' + content + '</i> </b>`,';
                                let formatContentWithLink = linkUpdatePage + '<b> <i>' + content + '</i> </b> </a>`,';
    
                                outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                            } else{
                                if(input.isBold){
                                    let formatContent = '`<b>' + content + '</b>`,';
                                    let formatContentWithLink = linkUpdatePage + '<b>' + content + '</b> </a>`,';
    
                                    outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                                } else if(input.isItalic){
                                    let formatContent = '`<i>' + content + '</i>`,';
                                    let formatContentWithLink = linkUpdatePage + '<i>' + content + '</i> </a>`,';
    
                                    outputRowTable += `${inputName}: ${isColumnFirst ? formatContentWithLink : formatContent}`;
                                } else{
                                    outputRowTable += `${inputName}: ${isColumnFirst ? (`
                                        ${linkUpdatePage}${content} </a>${'`'},
                                    `) : '`' + content + '`,'}`;
                                }
                            }
                        }

                    }

                    break;
                case 'object':
                    if(input.ref && !input.isImage){
						let fieldName = `${NAME_COLL_LOWERCASE}.${inputName}`;
                        outputRowTable += `${inputName}: ${fieldName}
                            ? ${fieldName}.${input.refShow}
                            : '<span class="badge bg-danger"> không tồn tại hoặc đã xoá </span>',`;
                    }
                    break;
                default:
                    break;
            }
        }

        isColumnFirst = false;
    })

	return `{
		${outputRowTable}
		createAt: moment(${NAME_COLL_LOWERCASE}.createAt).format('HH:mm DD/MM/YYYY'),
        action
	}`;
}

async function renderFunctionTableSub(fields) {
    let outputFunctionTableSub = '';

    for (const field of fields) {
        const input = field.input;

        if(input.tableSub){
            const FIELD_REF_CAPITALIZE = input.ref.toCapitalize();
            const FIELD_REF_UPPERCASE  = input.ref.toUpperCase();
            const FIELD_REF_LOWERCASE  = input.ref.toLowerCase();

            let outputLookupInputRef    = '';
            let outputInputSearch       = [];
            let fieldsRef               = [];

            const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() });
            if(coll){
                const listFields = await TYPE__COLL_COLL.find({ coll: coll._id }).lean();

                if(listFields && listFields.length){
                    fieldsRef = [...listFields];

                    for (const input of listFields) {
                        if(input.type === 'text'){
                            outputInputSearch[outputInputSearch.length] = input.name;
                        }

                        if(input.ref && input.type === 'object'){
                            outputLookupInputRef += `
                                {
                                    $lookup: {
                                        from: '${pluralize.plural(input.ref)}',
                                        localField: '${input.name}',
                                        foreignField: '_id',
                                        as: '${input.name}'
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$${input.name}',
                                        preserveNullAndEmptyArrays: true
                                    },
                                },
                            `;
                        } // END IF
                    } // END FOR

                } // END IF
            } // END IF

            outputFunctionTableSub += `
                getList${FIELD_REF_CAPITALIZE}ServerSideTableSub({
                    idsSelected = [],
                    keyword,
                    filter,
                    condition,
                    page,
                    limit,
                }){
                    return new Promise(async resolve => {
                        try {
                            if(isNaN(page)) page = 1;
                            if(isNaN(limit)) limit = 25;
        
                            let conditionObj = { state: 1, $or: [] };

                            ${outputInputSearch.length ? (`
                                if(keyword){
                                    let key = keyword.split(" ");
                                    key = '.*' + key.join(".*") + '.*';
        
                                    conditionObj.$or = [
                                        ${outputInputSearch.map(input => `{ ${input}: { $regex: key, $options: 'i' } }`)}
                                    ]
                                }
                            `) : ''}

                            if(filter && filter.length) {
                                if(filter.length > 1) {
                                    filter.map(filterObj => {
                                        if(filterObj.type === 'ref'){
                                            const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);
            
                                            if(condition === 'OR'){
                                                conditionObj.$or.push(conditionFieldRef);
                                            } else{
                                                conditionObj = { ...conditionObj, ...conditionFieldRef };
                                            }
                                        } else{
                                            const conditionByFilter = this.getConditionObj(filterObj);
            
                                            if (condition === 'OR') {
                                                conditionObj.$or.push(conditionByFilter);
                                            } else {
                                                conditionObj = { ...conditionObj, ...conditionByFilter };
                                            }
                                        }
                                    });
                                } else {
                                    let { type, ref, fieldRefName } = filter[0];
            
                                    if(type === 'ref'){
                                        conditionObj = {
                                            ...conditionObj,
                                            ...this.getConditionObj(ref, fieldRefName)
                                        };
                                    } else{
                                        conditionObj = {
                                            ...conditionObj,
                                            ...this.getConditionObj(filter[0])
                                        };
                                    }
                                }
                            }

                            if(conditionObj.$or && !conditionObj.$or.length){
                                delete conditionObj.$or;
                            }

                            const skip = (page - 1) * limit;
                            const total${FIELD_REF_CAPITALIZE} = await ${FIELD_REF_UPPERCASE}_COLL.countDocuments(conditionObj);

                            const list${FIELD_REF_CAPITALIZE}ByFilter = await ${FIELD_REF_UPPERCASE}_COLL.aggregate([
                                ${outputLookupInputRef}
                                {
                                    $match: conditionObj
                                },
                                { $skip: +skip },
                                { $limit: +limit },
                                { $sort: { modifyAt: -1 } },
                            ])

                            if(!list${FIELD_REF_CAPITALIZE}ByFilter){
                                return resolve({ 
                                    recordsTotal: total${FIELD_REF_CAPITALIZE},
                                    recordsFiltered: total${FIELD_REF_CAPITALIZE},
                                    data: [] 
                                });
                            }

                            const list${FIELD_REF_CAPITALIZE}DataTable = list${FIELD_REF_CAPITALIZE}ByFilter.map((${FIELD_REF_LOWERCASE}) => {
                                let action = ${'`<button type="button" class="btn btn-soft-primary btn-sm btn-select" data-id="${' + FIELD_REF_LOWERCASE + '._id}">Chọn</button>`'};

                                if(idsSelected.includes(${FIELD_REF_LOWERCASE}._id.toString())){
                                    action = ${'`<button type="button" class="btn btn-soft-danger btn-sm btn-unselect" data-id="${' + FIELD_REF_LOWERCASE + '._id}">Bỏ chọn</button>`'};
                                }

                                return ${generateTableSubView(fieldsRef, input.ref)}
                            });

                            return resolve({ 
                                error: false,
                                recordsTotal: total${FIELD_REF_CAPITALIZE},
                                recordsFiltered: total${FIELD_REF_CAPITALIZE},
                                data: list${FIELD_REF_CAPITALIZE}DataTable || [] 
                            });
                        } catch (error) {
                            console.error(error);
                            return resolve({ error: true, message: error.message });
                        }
                    })
                }
            `;
        }

    }
    
    return outputFunctionTableSub;
}

async function createContentModel(fields, fieldsExcept, collectionName, collectionDescription, pathSave, folderName, isServerSide, extendsAPI, isApiAddress, isSystemConfig) {
    const NAME_COLL_UPPERCASE       = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE       = collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE      = collectionName.toCapitalize();

    let internalImport 		        = [];
    let externalImport 		        = '';
    let outputImportConstant        = '';
    let outputImportRefConstant     = '';
    let outputRequirePackageRef     = '';
    let outputPackageRef            = [];

    for (const field of fields) {
		const input = field.input;

        if(check.isTrue(input.isSlug) && !internalImport.includes('convertToSlug')){
            internalImport[internalImport.length] = 'convertToSlug';
        }
        if(input.type === 'object' && !input.ref && !internalImport.includes('isEmptyObj')){
            internalImport[internalImport.length] = 'isEmptyObj';
        }
        if(input.name === 'email' && !internalImport.includes('checkEmail')){
            internalImport[internalImport.length] = 'checkEmail';
        }
        if(input.name === 'phone' && !internalImport.includes('checkPhoneNumber')){
            internalImport[internalImport.length] = 'checkPhoneNumber';
        }
        if(check.isTrue(input.isEnum) && !internalImport.includes('checkNumberIsValidWithRange')){
            internalImport[internalImport.length] = 'checkNumberIsValidWithRange';
        }
		if(check.isTrue(input.isCurrency) && !externalImport.includes('number-format.js')){
			externalImport += `const formatCurrency = require('number-format.js');`
        }
		if(check.isTrue(input.isEnum)){
            outputImportConstant += `${input.name.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE, `;
        }
        if(input.ref){
            outputPackageRef[outputPackageRef.length] = input.ref;
        }
        if(input.tableSub){
            const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() }).lean();
            if(coll){
                const listFields = await TYPE__COLL_COLL.find({ coll: coll._id }).lean();

                for (const field of listFields) {
                    if(field.isShowList && field.isEnum){
                        outputImportRefConstant += `
                            const { ${field.name.toUpperCase()}_${input.ref.toUpperCase()}_TYPE } = require('../../${input.ref.toLowerCase()}/constants/${input.ref.toLowerCase()}');
                        `;
                    }
                }
            }

            const infoColl = await MANAGE__COLL_COLL.findOne({ name: input.tableSub.trim() }).select('folderName').lean();

            if(infoColl){
                outputRequirePackageRef += `
                    var { MODEL: ${input.tableSub.toUpperCase()}_MODEL } = require('../../${infoColl.folderName}/models/${input.tableSub}');
                `;
            }
            
        }
    }

    if(outputPackageRef && outputPackageRef.length){
        let folderPackage = `${pathSave}/www/packages/${folderName}`;
        let existsCollections = [];

        outputPackageRef = [...new Set(outputPackageRef)];

        for (const package of outputPackageRef) {
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
                    outputRequirePackageRef += `
                        var ${packageRefUp}_COLL = require('../databases/${packageRefLow}-coll');
                        var { MODEL: ${packageRefUp}_MODEL } = require('../models/${packageRefLow}');
                    `;
                } else if(infoColl) {
                    outputRequirePackageRef += `
                        var ${packageRefUp}_COLL = require('../../${infoColl?.folderName || packageRefLow}/databases/${packageRefLow}-coll');
                        var { MODEL: ${packageRefUp}_MODEL } = require('../../${infoColl?.folderName || packageRefLow}/models/${packageRefLow}');
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
        const lodash = require('lodash');
        const moment = require('moment');
        const pluralize = require('pluralize');
        const fastcsv   = require('fast-csv');
        const path = require('path');
        const fs = require('fs');
        const { hash } = require('bcryptjs');
        const XlsxPopulate = require('xlsx-populate');
        const { MongoClient } = require('mongodb');
        ${externalImport} 

        /**
         * INTERNAL PACKAGE
         */
        const { 
            checkObjectIDs, cleanObject, IsJsonString, isEmptyObject, renderOptionFilter, colName, ${internalImport}
        } = require('../../../utils/utils');
        const { isTrue } = require('../../../tools/module/check');
        const { randomStringFixLength } = require('../../../utils/string_utils');
        const { compareTwoTimeWithCondition } = require('../../../utils/time_utils');

		const { ${outputImportConstant} } = require('../constants/${NAME_COLL_LOWERCASE}');
        ${outputImportRefConstant}

        /**
         * BASE
         */
        const BaseModel = require('../../../models/intalize/base_model');
        const HOST_PROD = process.env.HOST_PROD || 'localhost';
        const PORT_PROD = process.env.PORT_PROD || '5000';
        const domain    =  HOST_PROD + ":" + PORT_PROD;
        const URL_DATABASE  = process.env.URL_DATABASE || 'mongodb://localhost:27017';
        const NAME_DATABASE = process.env.NAME_DATABASE || 'ldk_tools_op';

        class Model extends BaseModel {
            constructor() {
                super(require('../databases/${NAME_COLL_LOWERCASE}-coll'))
            }
    `;

    // OUTPUT FUNCTION INSERT
    let outputFieldInsert                           = '';
    let outputDataInsert                            = '';
    let outputFieldSpecial                          = '';
	let outputFieldOptional			                = '';
    let outputFieldCheckCondition                   = '';
    let outputFieldCheckValidExist                  = '';
    let outputFieldCheckValidEnum                   = '';
    let outputFieldCheckValidRef                    = '';
    let outputFieldCheckValidPhone                  = '';
    let outputFieldCheckValidEmail                  = '';
    let outputFieldCheckDuplicate                   = '';
    let outputFieldCheckPrimaryKey                  = '';
    let outputAnnotatingInsert                      = '';
    let outputInsertTableSub                        = '';
    let outputInsertFrom                            = '';

    // OUTPUT FUNCTION UPDATE BY ID
    let outputFieldUpdate                           = '';
    let outputFieldNotRequireUpdate                 = '';
    let outputFieldParamsUpdate                     = '';
    let outputFieldParamsNotRequireUpdate           = '';
    let outputFieldSpecialUpdate                    = '';
    let outputFieldCheckConditionUpdate             = '';
    let outputFieldCheckValidExistUpdate            = '';
    let outputFieldCheckValidEnumUpdate             = '';
    let outputFieldCheckValidRefUpdate              = '';
    let outputFieldCheckValidRefNotRequireUpdate    = '';
    let outputFieldCheckValidPhoneUpdate            = '';
    let outputFieldCheckValidEmailUpdate            = '';
    let outputFieldCheckDuplicateUpdate             = '';
    let outputFieldCheckPrimaryKeyUpdate            = { get: '', condition: '' };
    let outputAnnotatingUpdate                      = '';
    let outputUpdateTableSub                        = '';
    let outputUpdateFrom                            = '';

    // OUTPUT INSERT
    let ouputInsert = '';

    // OUTPUT ORDER SORT
    let ouputSortIsOrder = '';

    // OUTPUT FUNCTION GET INFO BY ID
    let outputInputRef   = '';

    // OUTPUT FUNCTION GET LIST BY FILTER
    let outputInputSearch       = [];
    let outputFilterSearch      = '';
    let outputParamsFilter      = '';
    let outputAnnotatingFilter  = '';

    // OUTPUT FUNCTION GET LIST SERVER SIDE IS STATUS
    let outputCheckValidParamsIsStatusList  = ''; 
    let outputLookupInputRef                = ''; 

    // OUTPUT FUNCTION UPDATE STATUS
    let outputFieldParamStatus  = '';

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    for (const field of fields) {
        let input       = field.input;
        let fieldName   = input.note.toLowerCase() || input.name.toLowerCase();

        if(input.ref){
            outputInputRef += `${input.name} `;

            if(input.type === 'object'){
                let collName = pluralize.plural(input.ref);
                let checkPluralColl = collName[collName.length - 1];
                
                if (checkPluralColl.toLowerCase() != 's') {
                    collName += 's';
                }
                outputLookupInputRef += `
                    {
                        $lookup: {
                            from: '${collName}',
                            localField: '${input.name}',
                            foreignField: '_id',
                            as: '${input.name}'
                        }
                    },
                    {
                        $unwind: {
                            path: '$${input.name}',
                            preserveNullAndEmptyArrays: true
                        },
                    },
                `;
            }
        }

        if(input.type === 'text'){
            outputInputSearch[outputInputSearch.length] = input.name;

            if(!outputParamsFilter.includes('keyword')){
                outputParamsFilter += `keyword, `;
                outputAnnotatingFilter += `\t\t* @param {string} keyword\n`;
            }
        }

        if(input.type === 'number'){
            if(check.isTrue(input.isEnum)){
                outputParamsFilter += `${input.name}, `;
                outputFilterSearch += `
                    ${input.name} && (conditionObj.${input.name} = ${input.name});
                `;
                outputAnnotatingFilter += `\t\t* @enum {number} ${input.name}\n`;
            }

            if(check.isTrue(input.isCurrency)){
                outputParamsFilter += `${input.name}FromNumber, ${input.name}ToNumber, `;
                outputFilterSearch += `
                    if(${input.name}FromNumber && ${input.name}ToNumber){
                        conditionObj.${input.name} = {
                            $gte: ${input.name}FromNumber,
                            $lt: ${input.name}ToNumber,
                        };
                    }
                `;
                outputAnnotatingFilter += `\t\t* @param {number} ${input.name}FromNumber\n`;
                outputAnnotatingFilter += `\t\t* @param {number} ${input.name}ToNumber\n`;
            }
                      
            if(!check.isTrue(input.isEnum) && !check.isTrue(input.isCurrency)){
                outputAnnotatingFilter += `\t\t* @param {number} ${input.name}\n`;
            }
        }

        if(input.type === 'date'){
            outputParamsFilter += `${input.name}DateRange, `;
            outputFilterSearch += `
                if(${input.name}DateRange){
                    let [fromDate, toDate] = ${input.name}DateRange.split('-');
                    let _fromDate   = moment(fromDate.trim()).startOf('day').format();
                    let _toDate     = moment(toDate.trim()).endOf('day').format();

                    conditionObj.${input.name} = {
                        $gte: new Date(_fromDate),
                        $lte: new Date(_toDate)
                    }
                }
            `;
            outputAnnotatingFilter += `\t\t* @param {date} ${input.name}DateRange\n`;
        }

        if(!listFieldsExcept.includes(input.name)){

            if(check.isTrue(input.isInsert)){

                switch (input.type) {
                    case 'text':
                        outputAnnotatingInsert += `\t\t* @param {string} ${input.name}\n`;
                        if (check.isTrue(input.isPassword)) {
                            outputFieldCheckValidExist += `
                                if(!${input.name}) {
                                    return resolve({ error: true, message: '${fieldName} không được phép rỗng', status: 400 });
                                }
                                if(${input.name}.length < 6) {
                                    return resolve({ error: true, message: "${fieldName} không được bé hơn 6 ký tự", status: 400 });
                                }
                                let hashPassword = await hash(${input.name}, 8);
                                if (!hashPassword)
                                    return resolve({ error: true, message: 'Không thể mã hóa ${fieldName}', status: 400 });
                                
                            `;
                        } else if(!check.isTrue(input.isTinyMCE)){
                            outputFieldCheckValidExist += `
                                if(${input.name}.length > 125) {
                                    return resolve({ error: true, message: 'Độ dài ${fieldName} không được lớn hơn 125 ký tự', status: 400 });
                                }
                            `;
                        }
                        break;
                    default:
                        outputAnnotatingInsert += `\t\t* @param {${input.type}} ${input.name}\n`;
                        break;
                }

                if(input.type !== 'date' && !input.tableSub){
                    outputDataInsert += `${input.name},`;
                }

                // Output field insert params
                if(check.isTrue(field.input.isDefault) && input.type !== 'date'){

                    if(input.type === 'text'){
                        outputFieldInsert += `${input.name} = "${input.default}",`;
                    } else{
                        outputFieldInsert += `${input.name} = ${input.default},`;
                    }

                } else{
                    outputFieldInsert += `${input.name},`;
                }

                // Output field require
                if(check.isTrue(input.isRequire)){
                    if(input.type === 'array' || input.type === 'object'){

                        if(input.type === 'array'){
                            if(input.ref && !input.tableSub){
                                outputFieldCheckValidRef += `
                                    if(!checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExist += `
                                    if(!${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                        if(input.type === 'object'){
                            if(input.ref){
                                outputFieldCheckValidRef += `
                                    if(!checkObjectIDs([${input.name}])) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExist += `
                                    if(isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                    } else{                    
                        outputFieldCheckValidExist += `
                            if(!${input.name}) {
                                return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                            }
                        `;
                    }

                    if(input.type === 'date'){
                        if(input.dateType === 'time'){
                            outputFieldOptional += `
                                if(${input.name}){
                                    const hours = ${input.name}.slice(0, 2);
                                    const minutes = ${input.name}.slice(3);
                                    const date = new Date();
                                    date.setHours(hours, minutes);

                                    dataInsert.${input.name} = date;
                                }
                            `;
                        } else{
                            outputDataInsert += `${input.name}: new Date(${input.name}),`;
                        }
                    }

                    // Output field enum
                    if(check.isTrue(input.isEnum)){
                        if(input.type === 'text'){
                            outputFieldCheckValidEnum += `
                                if(![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }

                        if(input.type === 'number'){
                            outputFieldCheckValidEnum += `
                                if(!checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }
                    }

                    if(input.name === 'phone'){
                        outputFieldCheckValidPhone = `
                            if(!checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                    }
        
                    if(input.name === 'email'){
                        outputFieldCheckValidEmail = `
                            if(!checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                    }

                } else{

                    if(input.type === 'array' || input.type === 'object'){

                        if(input.type === 'array'){
                            if(input.ref && !input.tableSub){
                                outputFieldCheckValidRef += `
                                    if(${input.name} && !checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExist += `
                                    if(${input.name} && !${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }
        
                        if(input.type === 'object'){
                            if(input.ref){
                                outputFieldCheckValidRef += `
                                    if(${input.name} && !checkObjectIDs([${input.name}])) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExist += `
                                    if(${input.name} && isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                    }

                    if(input.type === 'date'){
                        if(input.dateType === 'time'){
                            outputFieldOptional += `
                                if(${input.name}){
                                    const hours = ${input.name}.slice(0, 2);
                                    const minutes = ${input.name}.slice(3);
                                    const date = new Date();
                                    date.setHours(hours, minutes);

                                    dataInsert.${input.name} = date;
                                }
                            `;
                        } else{
                            outputFieldOptional += `${input.name} && (dataInsert.${input.name} = new Date(${input.name}));`;
                        }
                    }

                    // Output field enum
                    if(check.isTrue(input.isEnum)){
                        if(input.type === 'text'){
                            outputFieldCheckValidEnum += `
                                if(${input.name} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }

                        if(input.type === 'number'){
                            outputFieldCheckValidEnum += `
                                if(${input.name} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }
                    }

                    if(input.name === 'phone'){
                        outputFieldCheckValidPhone = `
                            if(${input.name} && !checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                    }

                    if(input.name === 'email'){
                        outputFieldCheckValidEmail = `
                            if(${input.name} && !checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                    }

                }

                // Tạo câu điều kiện ràng buộc 2 field
                if(check.isTrue(input.isCompare)){
                    const isRequired = check.isTrue(input.isRequire);

                    if(check.isTrue(input.isSeparateCondition)){

                        input.dataCompareField.map(compareCondition => {
                            if(input.type === 'date') {
                                let { 
                                    fromField, toField, compare, messageError, 
                                    isExprCondition, calculationExpr, calculationValue, calculationUnit 
                                } = compareCondition;

                                let fieldCompare = compareCondition.toField;
                                let isExpr = check.isTrue(isExprCondition);

                                if(isExpr){
                                    fieldCompare = `moment(${fieldCompare}).${calculationExpr}(${calculationValue}, '${calculationUnit}').format()`;
                                }

                                outputFieldCheckCondition += `
                                    if(${!isRequired ? `${fromField} && ${toField} && ` : ''}compareTwoTimeWithCondition(${fromField}, ${fieldCompare}, '${compare}')) {
                                        return resolve({ error: true, message: '${messageError}', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckCondition += `
                                    if(${!isRequired ? `${compareCondition.fromField} && ${compareCondition.toField} && ` : ''}${compareCondition.fromField} ${compareCondition.compare} ${compareCondition.toField}) {
                                        return resolve({ error: true, message: '${compareCondition.messageError}', status: 400 });
                                    }
                                `;
                            }
                        });

                    } else{
                        let conditionExits = '';
                        let conditionCompare = '';

                        input.dataCompareField.map(compareCondition => {
                            let { 
                                fromField, toField, compare, condition, 
                                isExprCondition, calculationExpr, calculationValue, calculationUnit 
                            } = compareCondition;

                            let fieldCompare = compareCondition.toField;
                            let isExpr = check.isTrue(isExprCondition);

                            if(isExpr){
                                fieldCompare = `moment(${fieldCompare}).${calculationExpr}(${calculationValue}, '${calculationUnit}').format()`;
                            }

                            conditionExits += `${fromField} && ${toField} && `;

                            if(input.type === 'date') {
                                conditionCompare += `${condition || ''} compareTwoTimeWithCondition(${fromField}, ${fieldCompare}, '${compare}')`;
                            } else{
                                conditionCompare += `${condition || ''} ${fromField} ${compare} ${toField}`;
                            }
                        });

                        outputFieldCheckCondition += `
                            if(${!isRequired ? conditionExits : ''}${conditionCompare}) {
                                return resolve({ error: true, message: '${input.messageError}', status: 400 });
                            }
                        `;
                    }

                }

                if(check.isTrue(input.isSlug)){
                    outputFieldSpecial += `${input.name} = convertToSlug(${input.name});`;
                }

                if(check.isTrue(input.isUnique)){
                    outputFieldCheckDuplicate += `
                        const check${input.name.toCapitalize()}Exits = await ${NAME_COLL_UPPERCASE}_COLL.findOne({ ${input.name} });
                        if(check${input.name.toCapitalize()}Exits){
                            return resolve({
                                error: true,
                                message: '${input.note.toCapitalize() || input.name.toCapitalize()} đã tồn tại',
                                status: 400
                            });
                        }
                    `;
                }

                if(input.tableSub){
                    outputInsertTableSub += `
                        if(${input.name} && ${input.name}.length){
                            if(${input.name}.length === 1 && ${input.name}[0] === 'all'){
                                let arr${input.ref.toCapitalize()} = await ${input.ref.toUpperCase()}_COLL.find({ state: 1 }).lean();

                                let arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()} = arr${input.ref.toCapitalize()}.map(${pluralize.singular(input.name)} => ({
                                    ${pluralize.singular(input.name)},
                                    ${NAME_COLL_LOWERCASE}: infoAfterInsert._id
                                }))

                                await ${input.tableSub.toUpperCase()}_MODEL.insertMany(arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()});
                            } else{
                                let arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()} = ${input.name}.map(${pluralize.singular(input.name)} => ({
                                    ${pluralize.singular(input.name)},
                                    ${NAME_COLL_LOWERCASE}: infoAfterInsert._id
                                }))
            
                                await ${input.tableSub.toUpperCase()}_MODEL.insertMany(arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()});
                            }
                        }
                        
                    `;
                }

            }

            if(check.isTrue(input.isUpdate)){
                outputFieldParamsUpdate += `${input.name},`;
                outputFieldParamsNotRequireUpdate += `${input.name}, `;

                switch (input.type) {
                    case 'text':
                        outputAnnotatingUpdate += `\t\t* @param {string} ${input.name}\n`;

                        if(!check.isTrue(input.isTinyMCE)){
                            outputFieldCheckValidExistUpdate += `
                                if(${input.name}.length > 125) {
                                    return resolve({ error: true, message: 'Độ dài ${fieldName} không được lớn hơn 125 ký tự', status: 400 });
                                }
                            `;
                        }
                        break;
                    default:
                        outputAnnotatingUpdate += `\t\t* @param {${input.type}} ${input.name}\n`;
                        break;
                }

                // Output field require
                if(check.isTrue(input.isRequire)){
                    if(input.type === 'array' || input.type === 'object'){

                        if(input.type === 'array'){
                            if(input.ref && !input.tableSub){
                                outputFieldCheckValidRefUpdate += `
                                    if(!checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExistUpdate += `
                                    if(!${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                        if(input.type === 'object'){
                            if(input.ref){

                                if(!check.isTrue(input.isImage)){
                                    outputFieldCheckValidRefUpdate += `
                                        if(!checkObjectIDs([${input.name}])) {
                                            return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                        }
                                    `;
                                }

                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !checkObjectIDs([${input.name}])) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExistUpdate += `
                                    if(isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                    } else{                    
                        outputFieldCheckValidExistUpdate += `
                            if(!${input.name}) {
                                return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                            }
                        `;
                        
                    }

                    // Output field enum
                    if(check.isTrue(input.isEnum)){
                        if(input.type === 'text'){
                            outputFieldCheckValidEnumUpdate += `
                                if(![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                            outputFieldCheckValidRefNotRequireUpdate += `
                                if(${input.name} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }

                        if(input.type === 'number'){
                            outputFieldCheckValidEnumUpdate += `
                                if(!checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                            outputFieldCheckValidRefNotRequireUpdate += `
                                if(${input.name} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }
                    }

                    if(input.name === 'phone'){
                        outputFieldCheckValidPhoneUpdate = `
                            if(!checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                        outputFieldCheckValidRefNotRequireUpdate += `
                            if(${input.name} && !checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                    }
        
                    if(input.name === 'email'){
                        outputFieldCheckValidEmailUpdate = `
                            if(!checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                        outputFieldCheckValidRefNotRequireUpdate += `
                            if(${input.name} && !checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                    }

                    if(input.type === "date"){

                        let outputTimeFormat = `
                            if(${input.name}){
                                const hours = ${input.name}.slice(0, 2);
                                const minutes = ${input.name}.slice(3);
                                const date = new Date();
                                date.setHours(hours, minutes);

                                dataUpdate.${input.name} = date;
                            }
                        `;

                        let outputDateFormat = `${input.name} && (dataUpdate.${input.name} = new Date(${input.name}));`;

                        if(input.dateType === 'time'){
                            outputFieldUpdate += outputTimeFormat;
                            outputFieldNotRequireUpdate += outputTimeFormat;
                        } else{
                            outputFieldUpdate += outputDateFormat;
                            outputFieldNotRequireUpdate += outputDateFormat;
                        }

                    } else{
                        if(!input.tableSub){
                            outputFieldUpdate += `${input.name} && (dataUpdate.${input.name} = ${input.name});`;
                            outputFieldNotRequireUpdate += `${input.name} && (dataUpdate.${input.name} = ${input.name});`;
                        }
                    }

                } else{

                    if(input.type === 'array' || input.type === 'object'){

                        if(input.type === 'array'){
                            if(input.ref && !input.tableSub){
                                outputFieldCheckValidRefUpdate += `
                                    if(${input.name} && !checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !checkObjectIDs(${input.name})) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExistUpdate += `
                                    if(${input.name} && !${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !${input.name}.length) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }
        
                        if(input.type === 'object'){
                            if(input.ref){
                                outputFieldCheckValidRefUpdate += `
                                    if(${input.name} && !checkObjectIDs([${input.name}])) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && !checkObjectIDs([${input.name}])) {
                                        return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckValidExistUpdate += `
                                    if(${input.name} && isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                                outputFieldCheckValidRefNotRequireUpdate += `
                                    if(${input.name} && isEmptyObj(${input.name})) {
                                        return resolve({ error: true, message: 'Bạn cần nhập ${fieldName}', status: 400 });
                                    }
                                `;
                            }
                        }

                    }

                    // Output field enum
                    if(check.isTrue(input.isEnum)){
                        if(input.type === 'text'){
                            outputFieldCheckValidEnumUpdate += `
                                if(${input.name} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                            outputFieldCheckValidRefNotRequireUpdate += `
                                if(${input.name} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${input.name})) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }

                        if(input.type === 'number'){
                            outputFieldCheckValidEnumUpdate += `
                                if(${input.name} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                            outputFieldCheckValidRefNotRequireUpdate += `
                                if(${input.name} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${input.name} })) {
                                    return resolve({ error: true, message: '${fieldName} không hợp lệ', status: 400 });
                                }
                            `;
                        }
                    }

                    if(input.name === 'phone'){
                        outputFieldCheckValidPhoneUpdate = `
                            if(${input.name} && !checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                        outputFieldCheckValidRefNotRequireUpdate += `
                            if(${input.name} && !checkPhoneNumber(${input.name})) {
                                return resolve({ error: true, message: 'Số điện thoại không đúng định dạng', status: 400 });
                            }
                        `;
                    }

                    if(input.name === 'email'){
                        outputFieldCheckValidEmailUpdate = `
                            if(${input.name} && !checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                        outputFieldCheckValidRefNotRequireUpdate += `
                            if(${input.name} && !checkEmail(${input.name})) {
                                return resolve({ error: true, message: 'Email không hợp lệ', status: 400 });
                            }
                        `;
                    }

                    if(input.type === "date"){

                        let outputTimeFormat = `
                            if(${input.name}){
                                const hours = ${input.name}.slice(0, 2);
                                const minutes = ${input.name}.slice(3);
                                const date = new Date();
                                date.setHours(hours, minutes);

                                dataUpdate.${input.name} = date;
                            }
                        `;

                        let outputDateFormat = `${input.name} && (dataUpdate.${input.name} = new Date(${input.name}));`;

                        if(input.dateType === 'time'){
                            outputFieldUpdate += outputTimeFormat;
                            outputFieldNotRequireUpdate += outputTimeFormat;
                        } else{
                            outputFieldUpdate += outputDateFormat;
                            outputFieldNotRequireUpdate += outputDateFormat;
                        }
                        
                    } else if(!input.tableSub){
                        outputFieldNotRequireUpdate +=  `${input.name} && (dataUpdate.${input.name} = ${input.name});`;

                        if(input.ref){
                            outputFieldUpdate += `${input.name} && (dataUpdate.${input.name} = ${input.name});`;
                        } else{
                            outputFieldUpdate += `dataUpdate.${input.name} = ${input.name};`;
                        }
                        
                    }

                }

                // Tạo câu điều kiện ràng buộc 2 field
                if(check.isTrue(input.isCompare)){
                    const isRequired = check.isTrue(input.isRequire);

                    if(check.isTrue(input.isSeparateCondition)){

                        input.dataCompareField.map(compareCondition => {
                            if(input.type === 'date') {
                                let { 
                                    fromField, toField, compare, messageError, 
                                    isExprCondition, calculationExpr, calculationValue, calculationUnit 
                                } = compareCondition;

                                let fieldCompare = compareCondition.toField;
                                let isExpr = check.isTrue(isExprCondition);

                                if(isExpr){
                                    fieldCompare = `moment(${fieldCompare}).${calculationExpr}(${calculationValue}, '${calculationUnit}').format()`;
                                }

                                outputFieldCheckConditionUpdate += `
                                    if(${!isRequired ? `${fromField} && ${toField} && ` : ''}compareTwoTimeWithCondition(${fromField}, ${fieldCompare}, '${compare}')) {
                                        return resolve({ error: true, message: '${messageError}', status: 400 });
                                    }
                                `;
                            } else{
                                outputFieldCheckConditionUpdate += `
                                    if(${!isRequired ? `${compareCondition.fromField} && ${compareCondition.toField} && ` : ''}${compareCondition.fromField} ${compareCondition.compare} ${compareCondition.toField}) {
                                        return resolve({ error: true, message: '${compareCondition.messageError}', status: 400 });
                                    }
                                `;
                            }
                        });

                    } else{
                        let conditionExits = '';
                        let conditionCompare = '';

                        input.dataCompareField.map(compareCondition => {
                            let { 
                                fromField, toField, compare, condition, 
                                isExprCondition, calculationExpr, calculationValue, calculationUnit 
                            } = compareCondition;

                            let fieldCompare = compareCondition.toField;
                            let isExpr = check.isTrue(isExprCondition);

                            if(isExpr){
                                fieldCompare = `moment(${fieldCompare}).${calculationExpr}(${calculationValue}, '${calculationUnit}').format()`;
                            }

                            conditionExits += `${fromField} && ${toField} && `;

                            if(input.type === 'date') {
                                conditionCompare += `${condition || ''} compareTwoTimeWithCondition(${fromField}, ${fieldCompare}, '${compare}')`;
                            } else{
                                conditionCompare += `${condition || ''} ${fromField} ${compare} ${toField}`;
                            }
                        });

                        outputFieldCheckConditionUpdate += `
                            if(${!isRequired ? conditionExits : ''}${conditionCompare}) {
                                return resolve({ error: true, message: '${input.messageError}', status: 400 });
                            }
                        `;
                    }

                }

                if(check.isTrue(input.isSlug)){
                    outputFieldSpecialUpdate += `${input.name} = convertToSlug(${input.name});`;
                    outputFieldNotRequireUpdate += `${input.name} && (dataUpdate.${input.name} = convertToSlug(${input.name}));`;
                }

                if(check.isTrue(input.isUnique)){
                    outputFieldCheckDuplicateUpdate += `
                        const check${input.name.toCapitalize()}Exits = await ${NAME_COLL_UPPERCASE}_COLL.findOne({ ${input.name} });
                        if(check${input.name.toCapitalize()}Exits && checkExists.${input.name} !== ${input.name}){
                            return resolve({
                                error: true,
                                message: '${fieldName} đã tồn tại',
                                status: 400
                            });
                        }
                    `;
                }

                if(input.tableSub){
                    outputUpdateTableSub += `
                        if(${input.name} && ${input.name}.length){
                            if(${input.name}.length === 1 && ${input.name}[0] === 'all'){
                                let arr${input.ref.toCapitalize()} = await ${input.ref.toUpperCase()}_COLL.find({ state: 1 }).lean();

                                let arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()} = arr${input.ref.toCapitalize()}.map(${pluralize.singular(input.name)} => ({
                                    ${pluralize.singular(input.name)},
                                    ${NAME_COLL_LOWERCASE}: infoAfterUpdate._id
                                }))

                                await ${input.tableSub.toUpperCase()}_MODEL.deleteMany({
                                    ${NAME_COLL_LOWERCASE}: infoAfterUpdate._id
                                });
                                await ${input.tableSub.toUpperCase()}_MODEL.insertMany(arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()});
                            } else{
                                let arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()} = ${input.name}.map(${pluralize.singular(input.name)} => ({
                                    ${pluralize.singular(input.name)},
                                    ${NAME_COLL_LOWERCASE}: infoAfterUpdate._id
                                }))
            
                                await ${input.tableSub.toUpperCase()}_MODEL.deleteMany({
                                    ${NAME_COLL_LOWERCASE}: infoAfterUpdate._id
                                });
                                await ${input.tableSub.toUpperCase()}_MODEL.insertMany(arr${NAME_COLL_CAPITALIZE}${input.ref.toCapitalize()});
                            }
                        } else{
                            await ${input.tableSub.toUpperCase()}_MODEL.deleteMany({
                                ${NAME_COLL_LOWERCASE}: infoAfterUpdate._id
                            });
                        }
                    `;
                }
            }

            // Insert/Update from field ref
            let infoFieldExcept = null;

            if(fieldsExcept && fieldsExcept.length){
                infoFieldExcept = fieldsExcept.find(field => field.fieldName === input.name);
            }

            if(infoFieldExcept){
                if(check.isTrue(input.isInsert)){
                    let htmlDataInsert = '';
    
                    infoFieldExcept.listFieldsChoosed.map(fieldName => {
                        htmlDataInsert += `dataInsert.${fieldName} = ${input.name}Info.${fieldName};`;
                    })

                    outputInsertFrom += `
                        if(${input.name}){
                            const ${input.name}Info = await ${input.ref.toUpperCase()}_COLL.findById(${input.name});
                            ${htmlDataInsert}
                        }
                    `;
                }

                if(check.isTrue(input.isUpdate)){
                    let htmlDataUpdate = '';

                    infoFieldExcept.listFieldsChoosed.map(fieldName => {
                        htmlDataUpdate += `dataUpdate.${fieldName} = ${input.name}Info.${fieldName};`;
                    })

                    outputUpdateFrom += `
                        if(${input.name}){
                            const ${input.name}Info = await ${input.ref.toUpperCase()}_COLL.findById(${input.name});
                            ${htmlDataUpdate}
                        }
                    `;
                }
            }

        }

        if(check.isTrue(input.isPrimary)){
            outputFieldCheckPrimaryKey += `${input.name}, `;

            outputFieldCheckPrimaryKeyUpdate.get += `${input.name}, `;
            outputFieldCheckPrimaryKeyUpdate.condition += ` && checkExists.${input.name} !== ${input.name}`;
        }

        if(check.isTrue(input.isStatus)) {
            outputCheckValidParamsIsStatusList += `
                if (objFilterStatic.${input.name}) {
                    if (![1, 2].includes(Number(objFilterStatic.${input.name})) || Number.isNaN(Number(objFilterStatic.${input.name}))) {
                        return resolve({
                            error: true,
                            message: "${fieldName} không hợp lệ",
                            status: 400
                        }); 
                    }

                    conditionObj.${input.name} = Number(objFilterStatic.${input.name});
                }
            `
            outputFieldParamStatus += `
                let ${input.name} = '';
                if (${NAME_COLL_LOWERCASE}.${input.name} == 1) {
                    ${input.name} = 'checked';
                }
            `;
        }

        if(check.isTrue(input.isOrder)) {
            ouputSortIsOrder = `${input.name}: 1, `
            outputFieldParamStatus += `
                let ${input.name} = '';
                if (${NAME_COLL_LOWERCASE}.${input.name} || ${NAME_COLL_LOWERCASE}.${input.name} == 0) {
                    ${input.name} = ${NAME_COLL_LOWERCASE}.${input.name};
                }
            `;
        }

    }

    if (isSystemConfig) { // IS CONFIG SYSTEM
        ouputInsert = `
            let infoAfterInsert;
            let info${NAME_COLL_CAPITALIZE} = await this.getDocumentLatestUpdateWhere({});
            if (info${NAME_COLL_CAPITALIZE}) {
                infoAfterInsert = await this.updateWhereClause({
                    _id: info${NAME_COLL_CAPITALIZE}._id
                }, dataInsert);

                if (!infoAfterInsert) {
                    return resolve({
                        error: true,
                        message: 'Cập nhật ${collectionDescription || NAME_COLL_LOWERCASE} thất bại'
                    });
                }

                return resolve({
                    error: false,
                    data: infoAfterInsert
                });
            } else {
                infoAfterInsert = await this.insertData(dataInsert);

                if(!infoAfterInsert){
                    return resolve({ error: true, message: 'Tạo ${collectionDescription || NAME_COLL_LOWERCASE} thất bại' });
                }
            }
        `;
    } else {
        ouputInsert = `
            let infoAfterInsert = await this.insertData(dataInsert);

            if(!infoAfterInsert){
                return resolve({ error: true, message: 'Tạo ${collectionDescription || NAME_COLL_LOWERCASE} thất bại' });
            }
        `;
    }

    // FUNCTION INSERT
    outputtedFile += `
        /**
         * Tạo mới ${NAME_COLL_LOWERCASE}${outputAnnotatingInsert ? `\n${outputAnnotatingInsert}` : ''}
         * @param {objectId} author
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        insert({ ${outputFieldInsert} author }) {
            return new Promise(async resolve => {
                try {
                    if(author && !checkObjectIDs([author])) {
                        return resolve({ error: true, message: 'Người tạo không hợp lệ', status: 400 });
                    }
                    ${outputFieldCheckValidExist}
                    ${outputFieldCheckValidEnum}
                    ${outputFieldCheckValidEmail}
                    ${outputFieldCheckValidPhone}
                    ${outputFieldCheckCondition}
                    ${outputFieldCheckValidRef}
                    ${outputFieldCheckDuplicate}
                    ${outputFieldCheckPrimaryKey ? (`
                        const checkPrimaryKey = await ${NAME_COLL_UPPERCASE}_COLL.findOne({
                            ${outputFieldCheckPrimaryKey}
                        });
                        if (checkPrimaryKey) {
                            return resolve({
                                error: true,
                                message: 'Các trường ${outputFieldCheckPrimaryKey}đã tồn tại',
                                status: 400
                            });
                        }
                    `) : ''}
                    ${outputFieldSpecial}
                    let dataInsert = { ${outputDataInsert} author };
					${outputFieldOptional}
                    ${outputInsertFrom}
                    dataInsert = cleanObject(dataInsert);
                    ${ouputInsert}
                    ${outputInsertTableSub}
                    return resolve({ error: false, data: infoAfterInsert, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION UPDATE BY ID
    outputtedFile += `
        /**
         * Cập nhật ${NAME_COLL_LOWERCASE} 
         * @param {objectId} ${NAME_COLL_LOWERCASE}ID${outputAnnotatingUpdate ? `\n${outputAnnotatingUpdate}` : ''}
         * @param {objectId} userUpdate
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        update({ ${NAME_COLL_LOWERCASE}ID, ${outputFieldParamsUpdate} userUpdate }) {
            return new Promise(async resolve => {
                try {
                    if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID])) {
                        return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                    }

                    if(userUpdate && !checkObjectIDs([userUpdate])) {
                        return resolve({ error: true, message: 'Người cập nhật không hợp lệ', status: 400 });
                    }
                    ${outputFieldCheckValidExistUpdate}
                    ${outputFieldCheckValidEnumUpdate}
                    ${outputFieldCheckValidEmailUpdate}
                    ${outputFieldCheckValidPhoneUpdate}
                    ${outputFieldCheckConditionUpdate}
                    ${outputFieldCheckValidRefUpdate}
                    const checkExists = await ${NAME_COLL_UPPERCASE}_COLL.findById(${NAME_COLL_LOWERCASE}ID);
                    if(!checkExists){
                        return resolve({ error: true, message: '${collectionDescription || NAME_COLL_LOWERCASE} không tồn tại', status: 403 });
                    }
                    ${outputFieldCheckDuplicateUpdate}
                    ${outputFieldCheckPrimaryKeyUpdate.get ? (`
                        const checkPrimaryKey = await ${NAME_COLL_UPPERCASE}_COLL.findOne({
                            ${outputFieldCheckPrimaryKeyUpdate.get}
                        });
                        if (checkPrimaryKey${outputFieldCheckPrimaryKeyUpdate.condition}) {
                            return resolve({
                                error: true,
                                message: 'Các trường ${outputFieldCheckPrimaryKeyUpdate.get}đã tồn tại',
                                status: 400
                            });
                        }
                    `) : ''}
                    ${outputFieldSpecialUpdate}
                    let dataUpdate = { userUpdate };
                    ${outputFieldUpdate}
                    ${outputUpdateFrom}
                    let infoAfterUpdate = await this.findOneAndUpdate({ _id: ${NAME_COLL_LOWERCASE}ID }, dataUpdate);

                    if(!infoAfterUpdate){
                        return resolve({ error: true, message: 'Cập nhật thất bại', status: 422 });
                    }
                    ${outputUpdateTableSub}
                    return resolve({ error: false, data: infoAfterUpdate, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION UPDATE BY ID NOT REQUIRE
    outputtedFile += `
        /**
         * Cập nhật ${NAME_COLL_LOWERCASE} (không bắt buộc)
         * @param {objectId} ${NAME_COLL_LOWERCASE}ID${outputAnnotatingUpdate ? `\n${outputAnnotatingUpdate}` : ''}
         * @param {objectId} userUpdate
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        updateNotRequire({ ${NAME_COLL_LOWERCASE}ID, ${outputFieldParamsNotRequireUpdate} userUpdate }) {
            return new Promise(async resolve => {
                try {
                    if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID])) {
                        return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                    }

                    if(userUpdate && !checkObjectIDs([userUpdate])) {
                        return resolve({ error: true, message: 'Người cập nhật không hợp lệ', status: 400 });
                    }
                    ${outputFieldCheckValidRefNotRequireUpdate}
                    const checkExists = await ${NAME_COLL_UPPERCASE}_COLL.findById(${NAME_COLL_LOWERCASE}ID);
                    if(!checkExists){
                        return resolve({ error: true, message: '${collectionDescription || NAME_COLL_LOWERCASE} không tồn tại', status: 400 });
                    }
                    
                    let dataUpdate = { userUpdate };
                    ${outputFieldNotRequireUpdate}
                    let infoAfterUpdate = await this.findOneAndUpdate({ _id: ${NAME_COLL_LOWERCASE}ID }, dataUpdate);
    
                    if(!infoAfterUpdate){
                        return resolve({ error: true, message: 'Cập nhật thất bại', status: 422 });
                    }
    
                    return resolve({ error: false, data: infoAfterUpdate, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION DELETE BY ID
    outputtedFile += `
        /**
         * Xóa ${NAME_COLL_LOWERCASE} 
         * @param {objectId} ${NAME_COLL_LOWERCASE}ID
         * @this {BaseModel}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        deleteById(${NAME_COLL_LOWERCASE}ID) {
            return new Promise(async resolve => {
                try {
                    if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID])){
                        return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                    }

                    const infoAfterDelete = await this.findByIdAndDelete(${NAME_COLL_LOWERCASE}ID);

                    return resolve({ error: false, data: infoAfterDelete, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION DELETE BY LIST ID
    outputtedFile += `
        /**
         * Xóa ${NAME_COLL_LOWERCASE} 
         * @param {array} ${NAME_COLL_LOWERCASE}ID
         * @extends {BaseModel}
         * @returns {{ 
         *      error: boolean, 
         *      message?: string,
         *      data?: { "nMatched": number, "nUpserted": number, "nModified": number }, 
         * }}
         */
        deleteByListId(${NAME_COLL_LOWERCASE}ID) {
            return new Promise(async resolve => {
                try {
                    if(!checkObjectIDs(${NAME_COLL_LOWERCASE}ID)){
                        return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                    }

                    const infoAfterDelete = await ${NAME_COLL_UPPERCASE}_COLL.deleteMany({ _id: { $in: ${NAME_COLL_LOWERCASE}ID }});

                    return resolve({ error: false, data: infoAfterDelete, status: 204 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION GET INFO BY ID
    outputtedFile += `
        /**
         * Lấy thông tin ${NAME_COLL_LOWERCASE} 
         * @param {objectId} ${NAME_COLL_LOWERCASE}ID
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        getInfoById(${NAME_COLL_LOWERCASE}ID) {
            return new Promise(async resolve => {
                try {
                    if(!checkObjectIDs([${NAME_COLL_LOWERCASE}ID])){
                        return resolve({ error: true, message: '${NAME_COLL_LOWERCASE}ID không hợp lệ', status: 400 });
                    }

                    const info${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL.findById(${NAME_COLL_LOWERCASE}ID)
                                                ${outputInputRef && `.populate('${outputInputRef.trimEnd()}')\n`}
                    if(!info${NAME_COLL_CAPITALIZE}){
                        return resolve({ error: true, message: 'Không thế lâý thông tin ${collectionDescription || NAME_COLL_LOWERCASE}', status: 400 });
                    }

                    return resolve({ error: false, data: info${NAME_COLL_CAPITALIZE}, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    if (isSystemConfig) {
        outputtedFile += `
            /**
             * Lấy thông tin last record ${NAME_COLL_LOWERCASE} 
             * @extends {BaseModel}
             * @returns {{ error: boolean, data?: object, message?: string }}
             */
             getInfoLastRecord({}) {
                return new Promise(async resolve => {
                    try {
                        let info${NAME_COLL_CAPITALIZE} = await this.getDocumentLatestUpdateWhere({});
                        return resolve({ error: false, data: info${NAME_COLL_CAPITALIZE} });
                    } catch (error) {
                        console.error(error);
                        return resolve({ error: true, message: error.message });
                    }
                })
            }
        `;
    }

    // FUNCTION GET LIST
    outputtedFile += `
        /**
         * Lấy danh sách ${NAME_COLL_LOWERCASE} 
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: array, message?: string }}
         */
        getList() {
            return new Promise(async resolve => {
                try {
                    const list${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL
                        .find({ state: 1 })${outputInputRef && `.populate('${outputInputRef.trimEnd()}')`}
                        .sort({ ${ouputSortIsOrder} modifyAt: -1 })
                        .lean();

                    if(!list${NAME_COLL_CAPITALIZE}){
                        return resolve({ error: true, message: 'Không thể lấy danh sách ${collectionDescription || NAME_COLL_LOWERCASE}', status: 400 });
                    }

                    return resolve({ error: false, data: list${NAME_COLL_CAPITALIZE}, status: 200 });
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

	// FUNCTION GET LIST BY FILTER (CLIENT SIDE)
    outputtedFile += `
        /**
         * Lấy danh sách ${NAME_COLL_LOWERCASE} theo bộ lọc${outputAnnotatingFilter ? `\n${outputAnnotatingFilter}` : ''}
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: array, message?: string }}
         */
		getListByFilter({ ${outputParamsFilter} }) {
			return new Promise(async resolve => {
				try {
					let conditionObj = { state: 1 };
					${outputInputSearch.length ? (`
						if(keyword){
							let key = keyword.split(" ");
							key = '.*' + key.join(".*") + '.*';
		
							conditionObj.$or = [
								${outputInputSearch.map(input => `{ ${input}: { $regex: key, $options: 'i' } }`)}
							]
						}
					`) : ''}
					${outputFilterSearch}

					const list${NAME_COLL_CAPITALIZE}ByFilter = await ${NAME_COLL_UPPERCASE}_COLL
						.find(conditionObj)${outputInputRef && `.populate('${outputInputRef.trimEnd()}')`}
						.sort({ ${ouputSortIsOrder} modifyAt: -1 })
						.lean();

					if(!list${NAME_COLL_CAPITALIZE}ByFilter){
						return resolve({ error: true, message: "Không thể lấy danh sách ${collectionDescription || NAME_COLL_LOWERCASE}", status: 400 });
					}

					return resolve({ 
						error: false,
						data: list${NAME_COLL_CAPITALIZE}ByFilter,
                        status: 200
					});
				} catch (error) {
                    console.error(error);
					return resolve({ error: true, message: error.message, status: 500 });
				}
			})
		}
	`;

    // FUNCTION GET LIST BY FILTER (SERVER SIDE)
    outputtedFile += `
        /**
         * Lấy danh sách ${NAME_COLL_LOWERCASE} theo bộ lọc (server side)
         ${!isServerSide ? (
            outputAnnotatingFilter
         ) : (`
         * @param {string} keyword
         * @param {array} filter
         * @param {string} condition
         `)}
         * @param {number} page
         * @param {number} limit
         * @param {string} field
         * @param {string} dir
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        getListByFilterServerSide({ ${!isServerSide ? outputParamsFilter : 'keyword, filter, condition, objFilterStatic, '} page, limit, field, dir }) {
            return new Promise(async resolve => {
                try {
					if(isNaN(page)) page = 1;
					if(isNaN(limit)) limit = 25;

                    let conditionObj = { state: 1, $or: [] };

                    ${outputInputSearch.length ? (`
                        if(keyword){
                            let key = keyword.split(" ");
                            key = '.*' + key.join(".*") + '.*';

                            conditionObj.$or = [
                                ${outputInputSearch.map(input => `{ ${input}: { $regex: key, $options: 'i' } }`)}
                            ]
                        }
                    `) : ''}

                    ${!isServerSide ? outputFilterSearch : `
                        if(filter && filter.length) {
                            if(filter.length > 1) {
        
                                filter.map(filterObj => {
                                    if(filterObj.type === 'ref'){
                                        const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);
        
                                        if(condition === 'OR'){
                                            conditionObj.$or.push(conditionFieldRef);
                                        } else{
                                            conditionObj = { ...conditionObj, ...conditionFieldRef };
                                        }
                                    } else{
                                        const conditionByFilter = this.getConditionObj(filterObj);
        
                                        if (condition === 'OR') {
                                            conditionObj.$or.push(conditionByFilter);
                                        } else {
                                            conditionObj = { ...conditionObj, ...conditionByFilter };
                                        }
                                    }
                                });

                            } else {
                                let { type, ref, fieldRefName } = filter[0];
        
                                if(type === 'ref'){
                                    conditionObj = {
                                        ...conditionObj,
                                        ...this.getConditionObj(ref, fieldRefName)
                                    };
                                } else{
                                    conditionObj = {
                                        ...conditionObj,
                                        ...this.getConditionObj(filter[0])
                                    };
                                }
                            }
                        }

                    `}
                    ${outputCheckValidParamsIsStatusList ? `
                        if (!isEmptyObject(objFilterStatic)) {
                            ${outputCheckValidParamsIsStatusList}
                        }
                    ` : ''}

                    if(conditionObj.$or && !conditionObj.$or.length){
                        delete conditionObj.$or;
                    }

                    let sort = { ${ouputSortIsOrder} modifyAt: -1 };
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
					const total${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL.countDocuments(conditionObj);

                    const list${NAME_COLL_CAPITALIZE}ByFilter = await ${NAME_COLL_UPPERCASE}_COLL.aggregate([
                        ${outputLookupInputRef}
                        {
                            $match: conditionObj
                        },
                        { $sort: sort },
                        { $skip: +skip },
                        { $limit: +limit },
                    ])

                    if(!list${NAME_COLL_CAPITALIZE}ByFilter){
                        return resolve({ 
							recordsTotal: total${NAME_COLL_CAPITALIZE},
							recordsFiltered: total${NAME_COLL_CAPITALIZE},
							data: [] 
						});
                    }

					const list${NAME_COLL_CAPITALIZE}DataTable = list${NAME_COLL_CAPITALIZE}ByFilter.map((${NAME_COLL_LOWERCASE}, index) => {
                        ${outputFieldParamStatus}
						return ${generateTableView(fields, collectionName, isApiAddress)}
					});

                    return resolve({ 
						error: false,
						recordsTotal: total${NAME_COLL_CAPITALIZE},
						recordsFiltered: total${NAME_COLL_CAPITALIZE},
						data: list${NAME_COLL_CAPITALIZE}DataTable || [] 
					});
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message, status: 500 });
                }
            })
        }
    `;

    // FUNCTION GET LIST BY FILTER IMPORT
    outputtedFile += `
        /**
         * Lấy danh sách ${NAME_COLL_LOWERCASE} theo bộ lọc import
         ${!isServerSide ? (
            outputAnnotatingFilter
         ) : (`
         * @param {string} keyword
         * @param {array} filter
         * @param {string} condition
         `)}
         * @param {number} page
         * @param {number} limit
         * @param {string} field
         * @param {string} dir
         * @extends {BaseModel}
         * @returns {{ error: boolean, data?: object, message?: string }}
         */
        getListByFilterImport({ keyword, filter, condition, objFilterStatic, page, limit, field, dir }) {
            return new Promise(async resolve => {
                try {
					if(isNaN(page)) page = 1;
					if(isNaN(limit)) limit = 25;

                    let conditionObj = { state: 1, $or: [] };

                    ${outputInputSearch.length ? (`
                        if(keyword){
                            let key = keyword.split(" ");
                            key = '.*' + key.join(".*") + '.*';

                            conditionObj.$or = [
                                ${outputInputSearch.map(input => `{ ${input}: { $regex: key, $options: 'i' } }`)}
                            ]
                        }
                    `) : ''}

                    
                    if(filter && filter.length) {
                        if(filter.length > 1) {
    
                            filter.map(filterObj => {
                                if(filterObj.type === 'ref'){
                                    const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);
    
                                    if(condition === 'OR'){
                                        conditionObj.$or.push(conditionFieldRef);
                                    } else{
                                        conditionObj = { ...conditionObj, ...conditionFieldRef };
                                    }
                                } else{
                                    const conditionByFilter = this.getConditionObj(filterObj);
    
                                    if (condition === 'OR') {
                                        conditionObj.$or.push(conditionByFilter);
                                    } else {
                                        conditionObj = { ...conditionObj, ...conditionByFilter };
                                    }
                                }
                            });

                        } else {
                            let { type, ref, fieldRefName } = filter[0];
    
                            if(type === 'ref'){
                                conditionObj = {
                                    ...conditionObj,
                                    ...this.getConditionObj(ref, fieldRefName)
                                };
                            } else{
                                conditionObj = {
                                    ...conditionObj,
                                    ...this.getConditionObj(filter[0])
                                };
                            }
                        }
                    }

                    ${outputCheckValidParamsIsStatusList ? `
                        if (!isEmptyObject(objFilterStatic)) {
                            ${outputCheckValidParamsIsStatusList}
                        }
                    ` : ''}

                    if(conditionObj.$or && !conditionObj.$or.length){
                        delete conditionObj.$or;
                    }

                    let sort = { ${ouputSortIsOrder} modifyAt: -1 };
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
					const total${NAME_COLL_CAPITALIZE} = await ${NAME_COLL_UPPERCASE}_COLL.countDocuments(conditionObj);

                    const list${NAME_COLL_CAPITALIZE}ByFilter = await ${NAME_COLL_UPPERCASE}_COLL.aggregate([
                        ${outputLookupInputRef}
                        {
                            $match: conditionObj
                        },
                        { $sort: sort },
                        { $skip: +skip },
                        { $limit: +limit },
                    ])

                    if(!list${NAME_COLL_CAPITALIZE}ByFilter){
                        return resolve({ 
							recordsTotal: total${NAME_COLL_CAPITALIZE},
							recordsFiltered: total${NAME_COLL_CAPITALIZE},
							data: [] 
						});
                    }

                    return resolve({ 
						error: false,
						recordsTotal: total${NAME_COLL_CAPITALIZE},
						recordsFiltered: total${NAME_COLL_CAPITALIZE},
						data: list${NAME_COLL_CAPITALIZE}ByFilter || [] 
					});
                } catch (error) {
                    console.error(error);
                    return resolve({ error: true, message: error.message });
                }
            })
        }
    `;

    // FUNCTION GET LIST TABLE SUB (SERVER SIDE)
    outputtedFile += await renderFunctionTableSub(fields);

    // FUNCTION GET CONDITION
    outputtedFile += `
        /**
         * Lấy điều kiện lọc ${NAME_COLL_LOWERCASE}
         * @param {object} filter
         * @extends {BaseModel}
         * @returns {{ [key]: [value] }}
         */
        getConditionObj(filter, ref){
            let { type, fieldName, cond, value } = filter;
            let conditionObj = {};

            if(ref){
                fieldName = ${'`${ref}.${fieldName}`'};
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
    `;

    // FUNCTION GET LIST DATA TO EXPORT CSV
    outputtedFile +=`
        /**
        * Lấy điều kiện lọc ${NAME_COLL_LOWERCASE}
        * @param {array} arrayFilter
        * @extends {BaseModel}
        * @returns {{ error: boolean, data?: object, message?: string }}
        */
        getListByFilterExcel({  arrayFilter, arrayItemCustomerChoice, chooseCSV, nameOfParentColl }) {
            return new Promise(async resolve => {
                try {
                    
                    const list${NAME_COLL_CAPITALIZE}ByFilter = await ${NAME_COLL_UPPERCASE}_COLL.aggregate(arrayFilter)
                
                    if (!list${NAME_COLL_CAPITALIZE}ByFilter) {
                        return resolve({
                            error: true,
                            message: "Không thể lấy danh sách orderv3"
                        });
                    }
                    const CHOOSE_CSV = 1;
                    if (chooseCSV == CHOOSE_CSV) {
                        let nameFileExportCSV = nameOfParentColl + "-" +  moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".csv";
    
                        let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', nameFileExportCSV);
    
                        let result = this.exportExcelCsv(pathWriteFile, list${NAME_COLL_CAPITALIZE}ByFilter, nameFileExportCSV, arrayItemCustomerChoice)
                        return resolve(result);
                    } else {
                        let nameFileExportExcel = nameOfParentColl + "-" +  moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".xlsx";
                        
                        let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', nameFileExportExcel);
    
                        let result = await this.exportExcelDownload(pathWriteFile, list${NAME_COLL_CAPITALIZE}ByFilter, nameFileExportExcel, arrayItemCustomerChoice);
    
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
    `;

     // FUNCTION GET CONDITION FILTER ITEM CHOICED TO EXPORT CSV
    outputtedFile += `
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
    `;

    // FUNCTION GET CONDITION FILTER ITEM CHOICED TO EXPORT XLSX
    outputtedFile += `
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
    `;

    // FUNCTION FILE EXCEL IMPORT PREVIEW
    outputtedFile += `
        /**
         * Tải file import excel mẫu ${NAME_COLL_LOWERCASE}
         * @param {object} arrayItemCustomerChoice
         * @extends {BaseModel}
         * @returns {{ [key]: [value] }}
         */
         fileImportExcelPreview({
            opts,
            arrayItemCustomerChoice
        }) {
            return new Promise(async resolve => {
                try {
                    let fileNameRandom = moment(new Date()).format('LT') + "-" + moment(new Date()).format('DD-MM-YYYY') + ".xlsx";
                    let pathWriteFile = path.resolve(__dirname, '../../../../files/upload_excel_temp/', fileNameRandom);
                    let condition =  arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].condition; // BỘ LỌC && LOẠI IMPORT
                    let { listFieldPrimaryKey } = condition; // DANH SÁCH PRIMARY KEY
                    
                    if (!isEmptyObject(opts)) {
                        condition.conditionDeleteImport.filter    = opts.filter;   // BỘ LỌC CỦA ADMIN
                        condition.conditionDeleteImport.condition = opts.condition // BỘ LỌC CỦA ADMIN
                    }

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
                                        index ++;
                                    })
                                } else {
                                    workbook.sheet("Report").row(1).cell(index + 1).value(elem.note + nameCollChoice);
                                    index ++;
                                }
                            });

                            if (isTrue(condition.checkDownloadDataOld)) { // KIỂM TRA CÓ ĐÍNH ĐÈM DỮ LIỆU CŨ THEO ĐIỀU KIỆN
                                let listItemImport = arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].listItemImport; // LIST FIELD ĐÃ ĐƯỢC CẤU HÌNH
                                let { arrayFilter } = this.getConditionArrayFilterExcel(listItemImport, condition.conditionDeleteImport.filter, condition.conditionDeleteImport.condition); // LẤY RA ARRAY ARREGATE
                                
                                let groupBy${NAME_COLL_CAPITALIZE} = {};
                                listFieldPrimaryKey.map(key => {
                                    groupBy${NAME_COLL_CAPITALIZE} = {
                                        ...groupBy${NAME_COLL_CAPITALIZE},
                                        [key]: '$'+key
                                    }
                                });

                                arrayFilter = [
                                    ...arrayFilter,
                                    {
                                        $group: { 
                                            _id: {
                                                groupBy${NAME_COLL_CAPITALIZE}
                                            },
                                            listData: {
                                                $addToSet: "$$CURRENT"
                                            },
                                        }
                                    }
                                ];

                                const list${NAME_COLL_CAPITALIZE}ByFilter = await ${NAME_COLL_UPPERCASE}_COLL.aggregate(arrayFilter);

                                list${NAME_COLL_CAPITALIZE}ByFilter && list${NAME_COLL_CAPITALIZE}ByFilter.length && list${NAME_COLL_CAPITALIZE}ByFilter.map((item, index${NAME_COLL_CAPITALIZE}) => {
                                    let indexValue = 0;
                                    arrayItemCustomerChoice.map((elem, indexChoice) => {
                                        let variable = elem.name.split('.');
    
                                        if (elem.dataDynamic && elem.dataDynamic.length) { // KIỂM TRA FIELD CÓ CHỌN DYNAMIC
                                            // LỌC ITEM NÀO TỒN TẠI VỚI MẢNG DATA DYNAMIC
                                            let list${NAME_COLL_CAPITALIZE}AfterFilter = item.listData && item.listData.length && item.listData.filter(value => {
                                                let valueOfField;
                                                if (variable.length > 1) { // LẤY RA VALUE CỦA CỦA FIELD CHỌN
                                                    let objDataOfVariable = value[variable[0]] ? value[variable[0]] : '';
                                                    if (objDataOfVariable) {
                                                        valueOfField = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                                    }
                                                } else {
                                                    valueOfField = value[variable[0]] ? value[variable[0]] : '';
                                                }
                                                
                                                if (elem.dataDynamic.includes(valueOfField)) { // CHECK NẾU VALUE === CỘT
                                                    return value;
                                                }
                                            });
    
                                            // LỌC BIẾN DYNAMIC NÀO TỒN TẠI VỚI MẢNG DATA DYNAMIC
                                            let listValueExist = list${NAME_COLL_CAPITALIZE}AfterFilter.map(${NAME_COLL_CAPITALIZE} => {
                                                let valueOfField;
                                                if (variable.length > 1) { // LẤY RA VALUE CỦA CỦA FIELD CHỌN
                                                    let objDataOfVariable = ${NAME_COLL_CAPITALIZE}[variable[0]] ? ${NAME_COLL_CAPITALIZE}[variable[0]] : '';
                                                    if (objDataOfVariable) {
                                                        valueOfField = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                                    }
                                                } else {
                                                    valueOfField = ${NAME_COLL_CAPITALIZE}[variable[0]] ? ${NAME_COLL_CAPITALIZE}[variable[0]] : '';
                                                }
                                                return valueOfField;
                                            });
                                            console.log({
                                                listValueExist
                                            });
                                            elem.dataDynamic.map(dynamic => { 
                                            
                                                if (item.listData.length > elem.dataDynamic.length) { // KIỂM TRA ĐỘ DÀI CỦA DATA SO VỚI SỐ CỘT
                                                    // TODO: XỬ LÝ NHIỀU DYNAMIC
    
                                                } else {
                                                    for (const value of list${NAME_COLL_CAPITALIZE}AfterFilter) {
                                                        let valueOfField;
                                                        if (variable.length > 1) { // LẤY RA VALUE CỦA CỦA FIELD CHỌN
                                                            let objDataOfVariable = value[variable[0]] ? value[variable[0]] : '';
                                                            if (objDataOfVariable) {
                                                                valueOfField = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                                            }
                                                        } else {
                                                            valueOfField = value[variable[0]] ? value[variable[0]] : '';
                                                        }
                                                        
                                                        if (valueOfField == dynamic) {  // CHECK NẾU VALUE === CỘT
                                                            let valueImportDynamic = value[elem.variableChoice] ? value[elem.variableChoice] : '';
                                                            
                                                            // INSERT DỮ LIỆU VÀO BẢNG VỚI FIELD ĐƯỢC CHỌN THEO DẠNG DYNAMIC
                                                            workbook.sheet("Report").row(index${NAME_COLL_CAPITALIZE} + 2).cell(indexValue + 1).value(valueImportDynamic);
                                                            indexValue++;
                                                            break;
                                                        } else {
                                                            if(!listValueExist.includes(dynamic)){
                                                                indexValue++;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }) 
                                        } else { // DẠNG STATIC
                                            let value${NAME_COLL_CAPITALIZE};
                                            if (variable.length > 1) {
                                                let objDataOfVariable = item.listData[0][variable[0]] ? item.listData[0][variable[0]] : '';
                                                if (objDataOfVariable) {
                                                    value${NAME_COLL_CAPITALIZE} = objDataOfVariable[variable[1]] ? objDataOfVariable[variable[1]] : '';
                                                }
                                            } else {
                                                value${NAME_COLL_CAPITALIZE} = item.listData[0][variable[0]] ? item.listData[0][variable[0]] : '';
                                            }
    
                                            workbook.sheet("Report").row(index${NAME_COLL_CAPITALIZE} + 2).cell(indexValue + 1).value(value${NAME_COLL_CAPITALIZE});
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
    `;

    // FUNCTION IMPORT EXCEL
    outputtedFile += `
        /**
         * Upload File Excel Import Lưu Dữ Liệu ${NAME_COLL_LOWERCASE}
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
                            let conditionDeleteValuePrimaryKey = []; //array value của PRIMARY KEY từ file IMPORT

                            let condition = arrayItemCustomerChoice && arrayItemCustomerChoice.length && arrayItemCustomerChoice[0].condition;
    
                            let listFieldNameConditionDelete = [];
                            if (condition) {
                                listFieldNameConditionDelete = condition.conditionDeleteImport.filter.map(item => item.fieldName);
                            }
                            console.log({
                                listFieldNameConditionDelete
                            });
                            const client = await MongoClient.connect(URL_DATABASE);
                            const db = client.db(NAME_DATABASE)

                            for (; true;) {
                                if (arrayItemCustomerChoice && arrayItemCustomerChoice.length) {
                                    let conditionObj = {};
                                    let conditionObj__PrimaryKey = {}; //value của PRIMARY KEY từ file IMPORT
    
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
                                    let arrayConditionObjDynamic__PrimaryKey = [];
    
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
    
                                                        console.log({
                                                            nameFieldRef: [arrayItemCustomerChoice[indexOfListField].nameFieldRef],
                                                            listFieldNameConditionDelete
                                                        });
                                                        // LẤY VALUE để xóa ở dữ liệu DYNAMIC
                                                        if (listFieldNameConditionDelete && listFieldNameConditionDelete.length && listFieldNameConditionDelete.includes(arrayItemCustomerChoice[indexOfListField].nameFieldRef)) {
                                                            arrayConditionObjDynamic__PrimaryKey = [
                                                                ...arrayConditionObjDynamic__PrimaryKey,
                                                                {
                                                                    [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id,
                                                                }
                                                            ]
                                                        }
    
                                                        // if (listFieldNameConditionDelete && listFieldNameConditionDelete.length && listFieldNameConditionDelete.includes(arrayItemCustomerChoice[indexOfListField].name)) {
                                                        //     conditionObj__PrimaryKey = {
                                                        //         ...conditionObj__PrimaryKey,
                                                        //         [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id,
                                                        //     }
                                                        // }
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
    
                                                    // console.log({
                                                    //     docs,
                                                    //     ___item: arrayItemCustomerChoice[indexOfListField]
                                                    // });
                                                    if (docs) {
                                                        conditionObj = {
                                                            ...conditionObj,
                                                            [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id
                                                        };
                                                        
                                                        if (listFieldNameConditionDelete && listFieldNameConditionDelete.length && listFieldNameConditionDelete.includes(arrayItemCustomerChoice[indexOfListField].ref)) {
                                                            conditionObj__PrimaryKey = {
                                                                ...conditionObj__PrimaryKey,
                                                                [arrayItemCustomerChoice[indexOfListField].nameFieldRef]: docs._id
                                                            }
                                                        }
    
                                                        if (arrayItemCustomerChoice[indexOfListField].mappingRef && arrayItemCustomerChoice[indexOfListField].mappingRef.length) {
                                                            arrayItemCustomerChoice[indexOfListField].mappingRef.map(mapping => {
                                                                conditionObj = {
                                                                    ...conditionObj,
                                                                    [mapping]: docs[mapping]
                                                                }
                                                            })
                                                        }
                                                    }
                                                }
                                            } else {
                                                conditionObj = {
                                                    ...conditionObj,
                                                    [arrayItemCustomerChoice[indexOfListField].name]: variable
                                                };
                                                if (listFieldNameConditionDelete && listFieldNameConditionDelete.length && listFieldNameConditionDelete.includes(arrayItemCustomerChoice[indexOfListField].name)) {
                                                    conditionObj__PrimaryKey = {
                                                        ...conditionObj__PrimaryKey,
                                                        [arrayItemCustomerChoice[indexOfListField].name]: variable
                                                    }
                                                }
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
    
                                    let arrayCondditionObj = [];
                                    if (arrayConditionObjDynamic && arrayConditionObjDynamic.length) {
                                        arrayConditionObjDynamic.map(item => {
                                            arrayCondditionObj = [
                                                ...arrayCondditionObj,
                                                {
                                                    ...conditionObj,
                                                    ...item
                                                }
                                            ];
                                        });
    
                                        // Xóa với điều kiện => với PRIMARY KEY
                                        if (listFieldNameConditionDelete && listFieldNameConditionDelete.length) {
                                            if (arrayConditionObjDynamic__PrimaryKey && arrayConditionObjDynamic__PrimaryKey.length) { //value của PRIMARY KEY với DYNAMIC REF 
                                                arrayConditionObjDynamic__PrimaryKey.map(item => {
                                                    conditionDeleteValuePrimaryKey = [
                                                        ...conditionDeleteValuePrimaryKey,
                                                        {
                                                            ...conditionObj__PrimaryKey,
                                                            ...item
                                                        }
                                                    ];
                                                });
                                            } else {
                                                conditionDeleteValuePrimaryKey = [
                                                    ...conditionDeleteValuePrimaryKey,
                                                    conditionObj__PrimaryKey
                                                ];
                                            }
                                        }
                                    } else {
                                        arrayCondditionObj = [
                                            ...arrayCondditionObj,
                                            conditionObj
                                        ];
                                        if (listFieldNameConditionDelete && listFieldNameConditionDelete.length) {
                                            conditionDeleteValuePrimaryKey = [
                                                ...conditionDeleteValuePrimaryKey,
                                                conditionObj__PrimaryKey
                                            ];
                                        }
                                    }
                                    
                                   
                                    listData = [
                                        ...listData,
                                        ...arrayCondditionObj
                                    ];
    
                                    index++;
                                }
                            }
    
                            await fs.unlinkSync(file.path);
    
                            if(listData.length){
                                await this.changeDataImport({
                                    condition, list${NAME_COLL_CAPITALIZE}: listData,
                                    conditionDeleteValuePrimaryKey
                                });
                            } else{
                                return resolve({ error: true, message: 'Import thất bại' });
                            }
    
                            return resolve({ error: false, message: 'Import thành công' });
                        });
    
                } catch (error) {
                    return resolve({
                        error: true,
                        message: error.message
                    });
                }
            })
        }
    `;

    // FUNCTION IMPORT EXCEL
    outputtedFile += `
        /**
         * Lưu Dữ Liệu Theo Lựa Chọn ${NAME_COLL_LOWERCASE}
         * @param {object} list${NAME_COLL_CAPITALIZE}
         * @param {object} condition
         * @extends {BaseModel}
         * @returns {{ [key]: [value] }}
         */
         changeDataImport({
            condition, list${NAME_COLL_CAPITALIZE}, conditionDeleteValuePrimaryKey
        }) {
            return new Promise(async resolve => {
                try {
                    if (isTrue(condition.delete)) { // XÓA DATA CŨ
                        if (isTrue(condition.deleteAll)) { // XÓA TẤT CẢ DỮ LIỆU
                            console.log("====================XÓA TẤT CẢ DỮ LIỆU====================");
                            await ${NAME_COLL_UPPERCASE}_COLL.deleteMany({ });
                            let listDataAfterInsert = await ${NAME_COLL_UPPERCASE}_COLL.insertMany(list${NAME_COLL_CAPITALIZE});
                            return resolve({ error: false, message: 'Insert success', data: listDataAfterInsert });
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

                            if(filter && filter.length) {
                                if(filter.length > 1) {
            
                                    filter.map(filterObj => {
                                        if(filterObj.type === 'ref'){
                                            const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);
            
                                            if(conditionMultiple === 'OR'){
                                                conditionObj.$or.push(conditionFieldRef);
                                            } else{
                                                conditionObj = { ...conditionObj, ...conditionFieldRef };
                                            }
                                        } else{
                                            const conditionByFilter = this.getConditionObj(filterObj);
            
                                            if (conditionMultiple === 'OR') {
                                                conditionObj.$or.push(conditionByFilter);
                                            } else {
                                                conditionObj = { ...conditionObj, ...conditionByFilter };
                                            }
                                        }
                                    });

                                } else {
                                    let { type, ref, fieldRefName } = filter[0];
            
                                    if(type === 'ref'){
                                        conditionObj = {
                                            ...conditionObj,
                                            ...this.getConditionObj(ref, fieldRefName)
                                        };
                                    } else{
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
                            
                            // let listAfterDelete = await ${NAME_COLL_UPPERCASE}_COLL.deleteMany({ 
                            //     ...conditionObj 
                            // });
                            
                            let listValueAfterDelete = conditionDeleteValuePrimaryKey && conditionDeleteValuePrimaryKey.length && conditionDeleteValuePrimaryKey.map(value => {
                                return ${NAME_COLL_UPPERCASE}_COLL.deleteMany(value);
                            });
                            let result = await Promise.all(listValueAfterDelete);
                            /**
                             * ===============================================================================
                             * =========================END XÓA DỮ LIỆU VỚI ĐIỀU KIỆN=========================
                             * ===============================================================================
                             */

                            if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                                let list${NAME_COLL_CAPITALIZE}AfterInsert = list${NAME_COLL_CAPITALIZE}.map(item => {
                                    let listConditionFindOneUpdate = {};
                                    let { listFieldPrimaryKey } = condition;
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
                                   
                                    return ${NAME_COLL_UPPERCASE}_COLL.findOneAndUpdate(listConditionFindOneUpdate, {
                                        $set: item
                                    }, {
                                        upsert: true
                                    });
                                });
                                let resultAfterUpdate = await Promise.all(list${NAME_COLL_CAPITALIZE}AfterInsert);
                                return resolve({ error: false, message: 'Insert success' });
     
                            } else { // INSERT CÁI MỚI
                                console.log("====================INSERT CÁI MỚI 2====================");
                                let listDataAfterInsert = await ${NAME_COLL_UPPERCASE}_COLL.insertMany(list${NAME_COLL_CAPITALIZE});
                                return resolve({ error: false, message: 'Insert success', data: listDataAfterInsert });
                            }
                        }
                    } else { // KHÔNG XÓA DATA CŨ
                        if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                            console.log("====================KIỂM TRA TỒN TẠI VÀ UPDATE====================");
                            let list${NAME_COLL_CAPITALIZE}AfterInsert = list${NAME_COLL_CAPITALIZE}.map(item => {
                                let listConditionFindOneUpdate = {};
                                let { listFieldPrimaryKey } = condition;
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
                               
                                return ${NAME_COLL_UPPERCASE}_COLL.findOneAndUpdate(listConditionFindOneUpdate, {
                                    $set: item
                                }, {
                                    upsert: true
                                });
                            });
                            let resultAfterUpdate = await Promise.all(list${NAME_COLL_CAPITALIZE}AfterInsert);
                             
                            return resolve({ error: false, message: 'Insert success', data: resultAfterUpdate });
                        } else { // INSERT CÁI MỚI
                            console.log("====================INSERT CÁI MỚI====================");
                            let listDataAfterInsert = await ${NAME_COLL_UPPERCASE}_COLL.insertMany(list${NAME_COLL_CAPITALIZE});
                            return resolve({ error: false, message: 'Insert success', data: listDataAfterInsert });
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
    `;

    // FUNCTION GET CONDITION FILTER ITEM CHOICED TO EXPORT EXCEL
    outputtedFile += `
        /**
         * Lấy điều kiện lọc ${NAME_COLL_LOWERCASE}
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
                let mappingRef = [];
                listItemExport.map(element => {
                    if (element.ref == item.coll) {
                        nameFieldRef = element.name;
                        mappingRef = element.mappingRef;
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
                                mappingRef: mappingRef,
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
                                    mappingRef: mappingRef,
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
                                        mappingRef: mappingRef,
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
                                        mappingRef: mappingRef,
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

            if(filter && filter.length) {
                if(filter.length > 1) {

                    filter.map(filterObj => {
                        if(filterObj.type === 'ref'){
                            const conditionFieldRef = this.getConditionObj(filterObj.ref, filterObj.fieldRefName);

                            if(condition === 'OR'){
                                conditionObj.$or.push(conditionFieldRef);
                            } else{
                                conditionObj = { ...conditionObj, ...conditionFieldRef };
                            }
                        } else{
                            const conditionByFilter = this.getConditionObj(filterObj);

                            if (condition === 'OR') {
                                conditionObj.$or.push(conditionByFilter);
                            } else {
                                conditionObj = { ...conditionObj, ...conditionByFilter };
                            }
                        }
                    });

                } else {
                    let { type, ref, fieldRefName } = filter[0];

                    if(type === 'ref'){
                        conditionObj = {
                            ...conditionObj,
                            ...this.getConditionObj(ref, fieldRefName)
                        };
                    } else{
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

            ${outputCheckValidParamsIsStatusList ? `
                if (!isEmptyObject(objFilterStatic)) {
                    ${outputCheckValidParamsIsStatusList}
                }
            ` : ''}

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

                    let lookup = [
                        {
                            $lookup: {
                                from: collName,
                                localField: item.name,
                                foreignField: '_id',
                                as: item.name
                            },
                        },
                        {
                            $unwind : {
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
                                    $unwind : {
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
            let sort = { ${ouputSortIsOrder} modifyAt: -1 };

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

            
            
            return { arrayFilter, arrayItemCustomerChoice, refParent, arrayFieldIDChoice };
        }
    `;

    // FUNCTION EXTENDS
    outputtedFile += renderExtendsModel(collectionName, extendsAPI);

    outputtedFile += `
        }

        module.exports.MODEL = new Model;

        /**
         * COLLECTIONS
         */
        var ${NAME_COLL_UPPERCASE}_COLL = require('../databases/${NAME_COLL_LOWERCASE}-coll');
        ${outputRequirePackageRef}
    `;

    return outputtedFile;
}

module.exports.generateModel = (collectionName, collectionDescription, fields, fieldsExcept, pathSave, isServerSide, folderName, extendsAPI, isApiAddress, isSystemConfig) => {
    return new Promise(async resolve => {
        let outputtedFile = await createContentModel(fields, fieldsExcept, collectionName, collectionDescription, pathSave, folderName, isServerSide, extendsAPI, isApiAddress, isSystemConfig);

        try {
            let fileName = pathSave;
            outputtedFile = beautifyer(outputtedFile);

            fs.access(fileName, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                    logger.error(err);
                    return resolve({ 
                        error: true, 
                        message: `Can't access path ${fileName} or permission denined` 
                    });
                }

                fileName += `/www/packages/${folderName.toLowerCase()}`;

                if(!fs.existsSync(fileName)){
                    fs.mkdirSync(fileName);
                }

                if(!fs.existsSync(`${fileName}/models`)){
                    fs.mkdirSync(`${fileName}/models`);
                }

                fileName += `/models/${collectionName.toLowerCase()}.js`;

                fs.writeFile(fileName, outputtedFile, (err) => {
                    if (err) {
                        logger.error(err);
                        return resolve({ error: true, message: err });
                    }

                    log(chalk.green(`Create model success!! in the directory ${fileName}`));
                    resolve({ 
                        error: false, 
                        message: `Create model success!! in the directory ${fileName}` 
                    });
                });
            });

        } catch (error) {
            logger.error(error);
            resolve(error);
        }
    })
}
