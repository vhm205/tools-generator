const check             = require('../module/check');
const tool              = require('../module/tool');
const beautifyerHTML    = require('js-beautify').html_beautify;
const fs                = require('fs');
const chalk             = require('chalk');
const logger			= require('../../config/logger/winston.config');
const log               = console.log;

// const MANAGE__COLL_COLL = require('../database/manage_coll-coll');
// const TYPE__COLL_COLL   = require('../database/type_coll-coll');

const {
    createContentScriptListView,
} = require('./generate-script');


async function createContentListView(collectionName, collectionDescription, pathSave, folderName, arrChart, col) {
    const NAME_COLL_UPPERCASE 	= collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE  = collectionName.toCapitalize();

    let outputtedFile = `
        <style>
            
        </style>

        <!-- Page Content-->
        <div class="page-content">
            <div class="container-fluid">
                <!-- Page-Title -->
                <div class="row ">
                    <div class="col-sm-12">
                        <div class="page-title-box">
                            <div class="row">
                                <div class="col">
                                    <h4 class="page-title">List ${NAME_COLL_CAPITALIZE}</h4>
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="javascript:void(0);">Dashboard</a></li>
                                        <li class="breadcrumb-item"><a href="javascript:void(0);">Admin</a></li>
                                        <li class="breadcrumb-item active">List ${NAME_COLL_CAPITALIZE}</li>
                                    </ol>
                                </div>
                            </div><!--end row-->                                                              
                        </div><!--end page-title-box-->
                    </div><!--end col-->
                </div><!--end row-->

                <div class="row">
                        `;

    arrChart.map(chart => {
        let col = 'col-sm-12';
        if (chart.col) {
            col = chart.col;
        }
        switch (chart.TYPE_NAME) {
            case "LEADERBOARD":
                let listTh = '';
                chart.conditionDataSource.label_name.map(item => {
                    listTh += `<th>${item}</th>`;
                });

                outputtedFile += `
                    <div class="${col}">
                        <table id="tableList${chart.name.toCapitalize()}" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                            <thead>
                                <th>STT</th>
                                ${listTh}
                                <th>Giá trị</th>
                            </thead>
                            <tbody>

		                    </tbody>
                        </table>
                    </div>
                `;
                break;
            case "TIME_BASED":
                outputtedFile += `
                    <div class="${col}">
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title">${chart.description}</h4>
                            </div>
                            <div class="card-body">
                                <div class="chart-demo">
                                    <div id="chart${chart.name.toCapitalize()}" class="apex-charts"></div>
                                </div>                                        
                            </div>
                        </div>
                    </div>
                `;
                break;
            default:
                break;
        }
    }); 

	outputtedFile += `
			    </div>
		    </div>
	`;

    return outputtedFile;
}

module.exports.generateView = async (collectionName, collectionDescription, pathSave, folderName, arrChart) => {
    return new Promise(async resolve => {
        try {
            const NAME_COLL_LOWERCASE 		= collectionName.toLowerCase();
            let fileName 					= pathSave;
            // let outputtedFileScriptCommon   = createContentScriptCommon();

            // const { isCreateView, isCreateScript } = conditionCreatePackage;

            let outputtedFileListView           = '';

            let outputtedFileScriptListView     = '';

            outputtedFileListView           = await createContentListView(collectionName, collectionDescription, pathSave, folderName, arrChart);
            outputtedFileListView           = beautifyerHTML(outputtedFileListView);

            outputtedFileScriptListView     = createContentScriptListView(collectionName, collectionDescription, pathSave, folderName, arrChart);
            outputtedFileScriptListView     = beautifyerHTML(outputtedFileScriptListView);

            fs.access(fileName, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                    logger.error(err);
                    return resolve({ 
                        error: true, message: `Can't access path ${fileName} or permission denined` 
                    });
                }

                // const fileNameScriptCommon = `${fileName}/www/views/inc/supervisor/scripts/main-script.ejs`;

                // if(!fs.existsSync(fileNameScriptCommon)){
                //     fs.writeFileSync(fileNameScriptCommon, outputtedFileScriptCommon);
                // }

                // fs.readFile(`${pathSave}/www/views/index.ejs`, (err, data) => {
                //     if(err){
                //         log(chalk.red(err));
                //         return resolve({ error: true, message: err });
                //     }

                //     if(!data.includes(`main-script.ejs`)){
                //         fs.appendFileSync(`${pathSave}/www/views/index.ejs`, `\n<%- include('./inc/supervisor/scripts/main-script.ejs') %>\n`);
                //     }
                // });

                fileName += `/www/packages/${folderName.toLowerCase()}`;

                if(!fs.existsSync(fileName)){
                    fs.mkdirSync(fileName);
                }

                if(!fs.existsSync(`${fileName}/views`)){
                    fs.mkdirSync(`${fileName}/views`);
                }

                const pathView = `${fileName}/views`;
                
                if(!fs.existsSync(pathView)){
                    fs.mkdirSync(pathView);
                    fs.mkdirSync(`${pathView}/${NAME_COLL_LOWERCASE}`);
                    fs.mkdirSync(`${pathView}/${NAME_COLL_LOWERCASE}/scripts`);
                } else{
                    if(!fs.existsSync(`${pathView}/${NAME_COLL_LOWERCASE}`)){
                        fs.mkdirSync(`${pathView}/${NAME_COLL_LOWERCASE}`);
                        fs.mkdirSync(`${pathView}/${NAME_COLL_LOWERCASE}/scripts`);
                    }
                }

                tool.appendLeftbar(`${pathSave}/www/views/inc/admin/utils/leftbar.ejs`, collectionName, collectionDescription, folderName, 'fas fa-adjust');

                const fileNameListView          = `${fileName}/views/${NAME_COLL_LOWERCASE}/list_${NAME_COLL_LOWERCASE}.ejs`;
                const fileNameScriptListView    = `${fileName}/views/${NAME_COLL_LOWERCASE}/scripts/list_${NAME_COLL_LOWERCASE}s-script.ejs`;

                fs.writeFileSync(fileNameListView, outputtedFileListView);

                log(chalk.green(`Create view success!! in the directory ${fileName}`));

                fs.writeFileSync(fileNameScriptListView, outputtedFileScriptListView);

                log(chalk.green(`Create script success!! in the directory ${fileName}`));

                fs.readFile(`${pathSave}/www/views/index.ejs`, (err, data) => {
                    if(err){
                        logger.error(err);
                        return resolve({ error: true, message: err });
                    }

                    if(!data.includes(`/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}`)){
                        fs.appendFileSync(`${pathSave}/www/views/index.ejs`, (`
                            <% if (render.code === "/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}") { %>
                                <%- include('../packages/${folderName.toLowerCase()}/views/${NAME_COLL_LOWERCASE}/scripts/list_${NAME_COLL_LOWERCASE}s-script.ejs') %>
                            <% } %>
                        `));
                    }
                })

                resolve({ 
                    error: false, 
                    message: `Create view success!! in the directory ${fileName}` 
                });

            });
        } catch (error) {
            logger.error(error);
            resolve(error);
        }
    })
}
