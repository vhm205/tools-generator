const check         = require('../module/check');
const beautifyerJS  = require('js-beautify').js_beautify;
const fs            = require('fs');
const moment        = require('moment');
const logger		= require('../../config/logger/winston.config');
const chalk         = require('chalk');
const log           = console.log;


async function createContentApi(collectionName, arrChart) {
	const NAME_COLL_UPPERCASE 	= collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE 	= collectionName.toCapitalize();

    let outputtedFile = `
        /**
         * EXTERNAL PACKAGE
         */
        const path          = require('path');
        const fs            = require('fs');
        const beautifyer    = require('js-beautify').js_beautify;
        const moment        = require('moment');

        /**
         * INTERNAL PACKAGE
         */
        const ChildRouter = require('../../../routing/child_routing');
        const { CF_ROUTINGS_${NAME_COLL_UPPERCASE} } = require('../constants/${NAME_COLL_LOWERCASE}/${NAME_COLL_LOWERCASE}.uri');

        /**
         * MODELS
         */

        /**
         * COLLECTIONS
         */

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
    `;
    // arrChart.map(chart => {
        outputtedFile += `
            /**
             * Function: Danh sách Chart ${NAME_COLL_CAPITALIZE} (API, VIEW)
             * Date: ${moment(new Date()).format('DD/MM/YYYY')}
             * Dev: Automatic
             */
            [CF_ROUTINGS_${NAME_COLL_UPPERCASE}.LIST_${NAME_COLL_UPPERCASE}]: {
                config: {
                    scopes: [ 'list:${NAME_COLL_LOWERCASE}' ],
                    type: 'view',
                    view: 'index.ejs',
                    title: 'Danh sách ${NAME_COLL_CAPITALIZE}',
                    code: CF_ROUTINGS_${NAME_COLL_UPPERCASE}.LIST_${NAME_COLL_UPPERCASE},
                    inc: path.resolve(__dirname, '../views/${NAME_COLL_LOWERCASE}/list_${NAME_COLL_LOWERCASE}.ejs')
                },
                methods: {
                    get: [ async function(req, res){

                        ChildRouter.renderToView(req, res, {
                        });
                    }]
                },
            },
        `;
    // }); 

    outputtedFile += `
                }
            }
        };
    `;

    return outputtedFile;
}

async function createContentRoute(collectionName) {
    const NAME_COLL_UPPERCASE = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE = collectionName.toLowerCase();

    let BASE_ROUTE = '`${BASE_ROUTE}';
    let outputtedFile = `
        const BASE_ROUTE = '/${NAME_COLL_LOWERCASE}';
        const API_BASE_ROUTE = '/api/${NAME_COLL_LOWERCASE}';

        const CF_ROUTINGS_${NAME_COLL_UPPERCASE} = {
            LIST_${NAME_COLL_UPPERCASE}: ${BASE_ROUTE}/list-${NAME_COLL_LOWERCASE}\`,

            ORIGIN_APP: BASE_ROUTE,
        }

        exports.CF_ROUTINGS_${NAME_COLL_UPPERCASE} = CF_ROUTINGS_${NAME_COLL_UPPERCASE};
    `;

    return outputtedFile;
}


module.exports.generateApi = (collectionName, collectionDescription, pathSave, folderName, arrChart) => {
    return new Promise(async resolve => {
        let outputtedFileConstant   = await createContentRoute(collectionName, arrChart);
        let outputtedFileApi        = await createContentApi(collectionName, arrChart);

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

                        // let outputContentConfigConstant = appendContentConfigConstant(fields, collectionName);
                        let outputContentConfigConstant = '';
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
