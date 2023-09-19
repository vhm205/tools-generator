const check         = require('./module/check');
const tool          = require('./module/tool');
const beautifyer    = require('js-beautify').js_beautify;
const fs            = require('fs');
const chalk         = require('chalk');
const logger		= require('../config/logger/winston.config');
const log           = console.log;

function createContentSchema(fields, collectionName) {
    let outputtedFile = `
        "use strict";

        const Schema        = require('mongoose').Schema;
        const BASE_COLL     = require('../../../database/intalize/base-coll');

        module.exports = BASE_COLL('${collectionName.toLowerCase()}', {
    `;

    fields.map(field => {
        const input = field.input;

        if(input.note){
            if(check.isTrue(input.isEnum)){
                outputtedFile += `
                    /**
                     * ${input.note} ${input.dataEnum.map(item => `\n* ${item.value}: ${item.title}`)}
                     */
                `;    
            } else{
                outputtedFile += `
                    /**
                     * ${input.note}
                     */
                `; 
            }
        }

        // if(input.ref){
        //     if(input.type === 'array'){
        //         outputtedFile += `${input.name.slice(-2) !== 'ID' ? `${input.name}ID` : input.name}: [{`;
        //     } else{
        //         outputtedFile += `${input.name.slice(-2) !== 'ID' ? `${input.name}ID` : input.name}: {`;
        //     }
        // } else{
        //     outputtedFile += `${input.name}: {`;
        // }

        if(input.type === 'array' && input.ref){
            outputtedFile += `${input.name}: [{`;
        } else{
            outputtedFile += `${input.name}: {`;
        }

        switch (input.type) {
            case 'text':
                outputtedFile += `type: String,`;
                check.isTrue(input.isUnique)     && (outputtedFile += `unique: ${input.isUnique},`);
                check.isTrue(input.isRequire)    && (outputtedFile += `required: ${input.isRequire},`);
                check.isTrue(input.isTrim)       && (outputtedFile += `trim: ${input.isTrim},`);
                check.isTrue(input.isDefault)    && (
                    outputtedFile += `default: "${input.default || ''}",`
                );
                check.isTrue(input.isEnum) && (
                    outputtedFile += `enum: [${input.dataEnum.map(item => `"${item.value}"`)}],`
                );
                break;
            case 'number':
                outputtedFile += `type: Number,`;
                check.isTrue(input.isUnique)     && (outputtedFile += `unique: ${input.isUnique},`);
                check.isTrue(input.isRequire)    && (outputtedFile += `required: ${input.isRequire},`);
                check.isTrue(input.isDefault)    && (
                    outputtedFile += `default: ${input.default || ''},`
                );
                check.isTrue(input.isEnum) && (
                    outputtedFile += `enum: [${input.dataEnum.map(item => +item.value)}],`
                );
                break;
            case 'boolean':
                outputtedFile += `type: Boolean,`;
                check.isTrue(input.isRequire) && (outputtedFile += `required: ${input.isRequire},`);
                check.isTrue(input.isDefault) && (
                    outputtedFile += `default: ${input.default || true},`
                );
                break;
            case 'date':
                outputtedFile += `type: Date,`;
                check.isTrue(input.isRequire) && (outputtedFile += `required: ${input.isRequire},`);
                check.isTrue(input.isDefault) && (
                    outputtedFile += `default: ${input.default === 'datenow' ? 'Date.now' : new Date(input.default).getTime()}`
                );
                break;
            case 'object':
                if(input.ref){
                    outputtedFile += `type: Schema.Types.ObjectId,`;
                    outputtedFile += `ref: '${input.ref}',`
                } else{
                    outputtedFile += `type: Schema.Types.Mixed,`;
                }
                break;
            case 'array':
                if(input.ref){
                    outputtedFile += `type: Schema.Types.ObjectId,`;
                    outputtedFile += `ref: '${input.ref}',`
                } else{
                    outputtedFile += `type: Array,`
                }
                break;
            default:
                break;
        }

        if(input.ref){
            if(input.type === 'array'){
                outputtedFile += `}],`;
            } else{
                outputtedFile += `},`;
            }
        } else{
            outputtedFile += `},`;
        }
    })

    outputtedFile += '});';

    return outputtedFile;
}

module.exports.generateSchema = (collectionName, collectionDescription, fields, pathSave, folderName) => {
    return new Promise(async resolve => {
        let outputtedFile = createContentSchema(fields, collectionName);

        try {
            let fileName    = pathSave;
            outputtedFile   = beautifyer(outputtedFile);

            fs.access(fileName, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                    logger.error(err);
                    return resolve({ error: true, message: `Can't access path ${fileName} or permission denined` });
                }

                fileName += `/www/packages/${folderName.toLowerCase()}`;

                if(!fs.existsSync(fileName)){
                    fs.mkdirSync(fileName);
                    fs.mkdirSync(`${fileName}/databases`);
                    fs.writeFileSync(`${fileName}/index.js`, beautifyer(`
                        const ${collectionName.toUpperCase()}_COLL  = require('./databases/${collectionName.toLowerCase()}-coll');
                        const ${collectionName.toUpperCase()}_MODEL  = require('./models/${collectionName.toLowerCase()}').MODEL;
                        const ${collectionName.toUpperCase()}_ROUTES  = require('./apis/${collectionName.toLowerCase()}');
                        // MARK REQUIRE

                        module.exports = {
                            ${collectionName.toUpperCase()}_COLL,
                            ${collectionName.toUpperCase()}_MODEL,
                            ${collectionName.toUpperCase()}_ROUTES,
                            // MARK EXPORT
                        }
                    `));
                } else{
                    tool.appendIndex(`${fileName}/index.js`, collectionName);
                }

                if(!fs.existsSync(fileName + `/databases`)){
                    fs.mkdirSync(fileName + '/databases');
                }
                fileName += `/databases/${collectionName.toLowerCase()}-coll.js`;

                fs.writeFile(fileName, outputtedFile, (err) => {
                    if (err) {
                        logger.error(err);
                        return resolve({ error: true, message: err });
                    }

                    log(chalk.green(`Create schema success!! in the directory ${fileName}`));
                    resolve({ 
                        error: false, 
                        message: `Create schema success!! in the directory ${fileName}` 
                    });
                });

            });

        } catch (error) {
            logger.error(error);
            resolve(error);
        }
    })
}
