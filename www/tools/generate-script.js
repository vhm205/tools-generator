const check = require('./module/check');
const pluralize             = require('pluralize');
const MANAGE__COLL_COLL     = require('../database/manage_coll-coll');
const TYPE__COLL_COLL       = require('../database/type_coll-coll');

function renderMultipleUploadScript(fields) {
    // INSERT
    let htmlScriptInitUploadInsert = '';
    let htmlScriptGetUploadInsert  = '';

    // UPDATE
    let htmlScriptInitUploadUpdate = '';
    let htmlScriptGetUploadUpdate  = '';

    fields.map(field => {
        const input = field.input;

        if(check.isTrue(input.isImage) && input.type === 'array'){
            
            let outputInitUploadDropify = `
                initMultiDropify();

                $('.btn-add-more-upload').on('click', function () {
                    $(this).closest('.col-button-add-more-upload').before(${'`<div class="col-3 mb-2 me-2 wrap-file"><input type="file" class="dropify" data-max-file-size="10M" data-height="100" ' + `${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''}` + ' /></div>`'});
                    let inputFile = $(this).closest('.col-button-add-more-upload').prev().find('input[type="file"]');
                    inputFile.one('click', function (e) {
                        document.body.onfocus = function () {
                            const files = inputFile.prop('files');
                            !files.length && inputFile.closest('.wrap-file').remove();
                            document.body.onfocus = null;
                        }
                    })
                    inputFile.trigger('click');
                    initMultiDropify();
                });
            `;

            let outputGetFileUploadDropifyAdd = `
                const inputFiles${input.name} = [];

                $('.dropify').each((i, elem) => {
                    $(elem).prop('files').length && (inputFiles${input.name}[inputFiles${input.name}.length] = $(elem).prop('files')[0]);
                })

                if(inputFiles${input.name} && inputFiles${input.name}.length){
                    const links = await getLinksUpload(inputFiles${input.name});

                    dataInsert.${input.name} = links.map((link, index) => ({
                        name: link.fileName,
                        path: link.uri,
                        type: link.type,
                        size: inputFiles${input.name}[index].size,
                    }));
                }
            `;

            let outputGetFileUploadDropifyUpdate = `
                const inputFiles${input.name} = [];
                const filesOld${input.name}   = [];

                $('.dropify').each((i, elem) => {

                    if($(elem).prop('files').length){
                        inputFiles${input.name}[inputFiles${input.name}.length] = $(elem).prop('files')[0];  
                    } else{
                        if($(elem).data('path')){
                            filesOld${input.name}[filesOld${input.name}.length] = {
                                name: $(elem).data('name'),
                                path: $(elem).data('path'),
                                type: $(elem).data('type'),
                                size: $(elem).data('size'),
                            }
                        }
                    }

                })

                if(inputFiles${input.name} && inputFiles${input.name}.length){
                    const links = await getLinksUpload(inputFiles${input.name});

                    dataUpdate.${input.name} = links.map((link, index) => ({
                        name: link.fileName,
                        path: link.uri,
                        type: link.type,
                        size: inputFiles${input.name}[index].size,
                    }));

                    dataUpdate.${input.name} = [...dataUpdate.${input.name}, ...filesOld${input.name}];
                } else{
                    dataUpdate.${input.name} = filesOld${input.name};
                }
            `;

            let outputInitUploadCustom = `
                initUploadCustom();

                $(document).on('click', '.btn-remove-image', function () {
                    $(this).closest('.box-preview-image').addClass('d-none');
                    $(this).closest('.box-dropzone-file').find('.box-drag-and-drop').removeClass('d-none');
                });
            `;

            let outputGetFileUploadCustomAdd = `
                dataInsert.${input.name} = [];
                $('.box-dropzone-file.dropzone-${input.name} .box-drag-and-drop.d-none').each((i, elem) => {
                    const name = $(elem).attr('name');
                    const size = $(elem).attr('size');
                    const type = $(elem).attr('type');
                    const path = $(elem).attr('path');

                    if(name && path){
                        dataInsert.${input.name} = [...dataInsert.${input.name}, {
                            name, size, type, path
                        }]
                    }
                })
            `;

            let outputGetFileUploadCustomUpdate = `
                dataUpdate.${input.name} = [];
                $('.box-dropzone-file.dropzone-${input.name} .box-drag-and-drop.d-none').each((i, elem) => {
                    const name = $(elem).attr('name');
                    const size = $(elem).attr('size');
                    const type = $(elem).attr('type');
                    const path = $(elem).attr('path');

                    if(name && path){
                        dataUpdate.${input.name} = [...dataUpdate.${input.name}, {
                            name, size, type, path
                        }]
                    }
                })
            `;

            if(check.isTrue(input.isInsert)){
                if(+input.typeUpload === 1){

                    if(!htmlScriptInitUploadInsert.includes('initMultiDropify')){
                        htmlScriptInitUploadInsert += outputInitUploadDropify;
                    }

                    if(!htmlScriptGetUploadInsert.includes(`inputFiles${input.name}`)){
                        htmlScriptGetUploadInsert += outputGetFileUploadDropifyAdd;
                    }

                } else{

                    if(!htmlScriptInitUploadInsert.includes('initUploadCustom')){
                        htmlScriptInitUploadInsert += outputInitUploadCustom;
                    }

                    if(!htmlScriptGetUploadInsert.includes(`dataInsert.${input.name}`)){
                        htmlScriptGetUploadInsert += outputGetFileUploadCustomAdd;
                    }

                }
            }

            if(check.isTrue(input.isUpdate)){
                if(+input.typeUpload === 1){

                    if(!htmlScriptInitUploadUpdate.includes('initMultiDropify')){
                        htmlScriptInitUploadUpdate += outputInitUploadDropify;
                    }

                    if(!htmlScriptGetUploadUpdate.includes(`inputFiles${input.name}`)){
                        htmlScriptGetUploadUpdate += outputGetFileUploadDropifyUpdate;
                    }
                    
                } else{

                    if(!htmlScriptInitUploadUpdate.includes('initUploadCustom')){
                        htmlScriptInitUploadUpdate += outputInitUploadCustom;
                    }

                    if(!htmlScriptGetUploadUpdate.includes(`dataUpdate.${input.name}`)){
                        htmlScriptGetUploadUpdate += outputGetFileUploadCustomUpdate;
                    }

                }
            }

        }

    })

    return {
        htmlInsertUpload: {
            htmlScriptInitUploadInsert,
            htmlScriptGetUploadInsert
        },
        htmlUpdateUpload: {
            htmlScriptInitUploadUpdate,
            htmlScriptGetUploadUpdate
        }
    };
}

async function renderScriptTableSub(fields, collectionName, typePage) {
    let outputScriptTableSub = '';
    let hasTableSub = false;

    for (const field of fields) {
        const input = field.input;

        if(input.tableSub){
            const FIELD_REF_LOWERCASE   = input.ref.toLowerCase();
            const FIELD_REF_CAPITALIZE  = input.ref.toCapitalize();

            let outputFieldColumnTable = '';

            const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() });
            if(coll){
                const listFields = await TYPE__COLL_COLL.find({ coll: coll._id }).lean();

                if(listFields && listFields.length){
                    fieldsRef = [...listFields];

                    for (const input of listFields) {
                        if(input.isShowList && !input.isOrder){
                            outputFieldColumnTable += `{ "data": "${input.name}" },`;
                        }
                    }

                }
            }

            let initVariable = `let ${input.ref}Selected = [];`;

            if(typePage === 'UPDATE'){
                let outputListTableSub = `list${input.tableSub.toCapitalize()}`;

                initVariable = `
                    let list${input.ref}Selected = ${'`<%= ' + outputListTableSub + ' && ' + outputListTableSub + '.map(item => item.' + pluralize.singular(input.name) + ') %>`'}.split(',').filter(Boolean);
                    let ${input.ref}Selected = list${input.ref}Selected || [];
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                `;
            }

            outputScriptTableSub += `
                let opts${FIELD_REF_CAPITALIZE} = {};
                let dataTable${FIELD_REF_CAPITALIZE} = {};
                ${initVariable}

                $('#modalFilter${FIELD_REF_CAPITALIZE}').on('hidden.bs.modal', function () {
                    $('#btnConfirmUpdate').attr('disabled', false);
                })

                $('input[type="radio"][name="rdOptions${FIELD_REF_CAPITALIZE}"]').on('change', function () {
                    const value = $(this).val()

                    if(value === 'specify'){
                        $('[data-bs-target="#modalFilter${FIELD_REF_CAPITALIZE}"]').removeClass('d-none');
                    } else{
                        $('[data-bs-target="#modalFilter${FIELD_REF_CAPITALIZE}"]').addClass('d-none');
                    }
                });

                $('[data-bs-target="#modalFilter${FIELD_REF_CAPITALIZE}"]').on('click', function () {
                    if(!Object.keys(dataTable${FIELD_REF_CAPITALIZE}).length){
                        dataTable${FIELD_REF_CAPITALIZE} = $('#modalFilter${FIELD_REF_CAPITALIZE} .table-list').DataTable({
                            'iDisplayLength': 5,
                            ...languageDataTable,
                            "processing": true,
                            "serverSide": true,
                            "ajax": {
                                "type": "POST",
                                "url": '/${collectionName.toLowerCase()}/list-${FIELD_REF_LOWERCASE}-table-sub',
                                "dataType": "json",
                                data: d => ({ ...d, ...opts${FIELD_REF_CAPITALIZE} })
                            },
                            "columns": [
                                ${outputFieldColumnTable}
                                { "data": "createAt" },
                                { "data": "action" }
                            ],
                        });
                    }
                });

                $(document).on('click', '#modalFilter${FIELD_REF_CAPITALIZE} .btn-select', function () {
                    let { page } = dataTable${FIELD_REF_CAPITALIZE}.page.info();
                    let htmlRow = $(this).closest('tr').clone();
                    let rowID = htmlRow.find('.btn-select').data('id');

                    if(${input.ref}Selected.includes(rowID)){
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Bạn đã chọn ${coll.description} này',
                            icon: 'warning'
                        });
                    }

                    ${input.ref}Selected[${input.ref}Selected.length] = rowID;
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    dataTable${FIELD_REF_CAPITALIZE}.page(page).draw('page');

                    let totalCurrent = +$('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text();
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(totalCurrent + 1);
                });
        
                $(document).on('click', '#modalFilter${FIELD_REF_CAPITALIZE} .btn-unselect', function () {
                    let { page } = dataTable${FIELD_REF_CAPITALIZE}.page.info();
                    let rowID = $(this).data('id');

                    ${input.ref}Selected = ${input.ref}Selected.filter(id => id !== rowID);
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    dataTable${FIELD_REF_CAPITALIZE}.page(page).draw('page');

                    let totalCurrent = +$('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text();
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(totalCurrent >= 1 ? totalCurrent - 1 : 0);
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-select-all').on('click', function () {
                    let { page } = dataTable${FIELD_REF_CAPITALIZE}.page.info();
                    let totalSelect = 0;
                    let bodyTable = $('#modalFilter${FIELD_REF_CAPITALIZE} .table-list tbody').clone();

                    bodyTable.find('tr button').map((i, elem) => {
                        const rowID = $(elem).data('id');

                        if (!${input.ref}Selected.includes(rowID)) {
                            totalSelect++;
                            ${input.ref}Selected[${input.ref}Selected.length] = rowID;
                        }
                    })
        
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    dataTable${FIELD_REF_CAPITALIZE}.page(page).draw('page');

                    let totalCurrent = +$('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text();
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(totalCurrent + totalSelect);
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-unselect-current-page').on('click', function () {
                    let { page } = dataTable${FIELD_REF_CAPITALIZE}.page.info();
                    let totalSelect = 0;
        
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .table-list tbody tr button').each((i, elem) => {
                        const rowID = $(elem).data('id');
                        if(${input.ref}Selected.includes(rowID)){
                            totalSelect++;
                        }
                        ${input.ref}Selected = ${input.ref}Selected.filter(id => id !== rowID);
                        totalSelect++;
                    })
        
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    dataTable${FIELD_REF_CAPITALIZE}.page(page).draw('page');

                    let totalCurrent = +$('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text();
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(totalCurrent >= totalSelect ? totalCurrent - totalSelect : 0);
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-unselect-all').on('click', function () {
                    ${input.ref}Selected = [];
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();

                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(0);
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .input-search-select').on('keypress', function(e) {
                    if (e.which == 13) {
                        opts${FIELD_REF_CAPITALIZE}.keyword = $(this).val();
                        dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    }
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-search-select').on('click', function () {
                    opts${FIELD_REF_CAPITALIZE}.keyword = $('#modalFilter${FIELD_REF_CAPITALIZE} .input-search-select').val().trim();
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-reset-filter').on('click', function () {
                    opts${FIELD_REF_CAPITALIZE}.filter = [];
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                });

                $('#offcanvasCondition${FIELD_REF_CAPITALIZE}').on('hide.bs.offcanvas', function() {
                    $('.modal-backdrop').removeClass('unblur');
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-cancel-select').on('click', function () {
                    ${input.ref}Selected = [];
                    opts${FIELD_REF_CAPITALIZE}.idsSelected = ${input.ref}Selected;
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();

                    $('#btnOpenModalSelect${FIELD_REF_CAPITALIZE}').text('Chọn ${coll.description}');
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .total-selected').text(0);
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-save-select').on('click', function () {
                    const totalSelected = ${input.ref}Selected.length;
                    if(totalSelected){
                        $('#btnOpenModalSelect${FIELD_REF_CAPITALIZE}').text(${'`Đã chọn ${totalSelected} ' + coll.description + '`'});
                    } else{
                        $('#btnOpenModalSelect${FIELD_REF_CAPITALIZE}').text('Chọn ${coll.description}');
                    }
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-discard-filter').on('click', function() {
                    opts${FIELD_REF_CAPITALIZE}.filter = [];
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                    $('.modal-backdrop').addClass('unblur');
                    $('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-item]:not(.d-none)').remove();
                    $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-add-filter').trigger('click');
                });

                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-add-filter').on('click', function() {
                    const tid = randomStringAndNumberFixLengthCode(15);
                    const template = $('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-item].d-none')
                        .clone()
                        .removeClass('d-none')
                        .attr('__tid', tid);
        
                    // Append condition field
                    $('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-list="condition"]').append(template);
        
                    // Set select 2
                    template.find('.input-field-compare, .input-select-value').each((i, elem) => {
                        $(elem).select2({
                            dropdownParent: template,
                            width: '100%'
                        });
                    })
        
                    template.find('.input-field-name, .input-field-ref-name').select2({
                        dropdownParent: template,
                        width: "100%"
                    });
        
                    if ($('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-item]:not(.d-none)').length > 1) {
                        template.find('.line-condition').removeClass('d-none');
                    }
                });
                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-add-filter').trigger('click');
        
                $('#modalFilter${FIELD_REF_CAPITALIZE} .btn-apply-filter').on('click', function() {
                    const conditions = $('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-item]:not(.d-none)');
                    opts${FIELD_REF_CAPITALIZE}.filter = [];
        
                    conditions.each((i, condition) => {
                        let fieldName = $(condition).find('.input-field-name').val();
                        let type = $(condition).find('.input-field-name').find(":selected").data('type');
                        let fieldCondition = $(condition).find(${'`[data-follow=${fieldName}]`'});
        
                        if (type && fieldName) {
                            if (type === 'ref') {
                                let fieldRefName = fieldCondition.find('.input-field-ref-name').val();
                                let typeFieldRef = fieldCondition.find('.input-field-ref-name').find(":selected").data('type');
                                let fieldRefCondition = fieldCondition.find(${'`[data-follow=${fieldRefName}]`'});
                                let cond = fieldRefCondition.find('.input-field-compare').val();
                                let value = fieldRefCondition.find('.input-field-value:not(.d-none), .input-select-value').val();
        
                                opts${FIELD_REF_CAPITALIZE}.filter = [...opts${FIELD_REF_CAPITALIZE}.filter, {
                                    type,
                                    fieldRefName: fieldName,
                                    ref: {
                                        type: typeFieldRef,
                                        fieldName: fieldRefName,
                                        cond,
                                        value
                                    }
                                }]
                            } else {
                                let cond = fieldCondition.find('.input-field-compare').val();
                                let value = fieldCondition.find('.input-field-value:not(.d-none), .input-select-value').val();
        
                                opts${FIELD_REF_CAPITALIZE}.filter = [...opts${FIELD_REF_CAPITALIZE}.filter, {
                                    type,
                                    fieldName,
                                    cond,
                                    value
                                }]
                            }
                        }
        
                    })

                    $('.modal-backdrop').addClass('unblur');
                    opts${FIELD_REF_CAPITALIZE}.condition = $('#modalFilter${FIELD_REF_CAPITALIZE} [data-repeater-item]:not(.d-none) .type-condition').attr('data-type-condition');
                    dataTable${FIELD_REF_CAPITALIZE}.ajax.reload();
                });

                // END SCRIPT MODAL SELECT ${coll.name.toUpperCase()}
            `;

            hasTableSub = true;
        }

    }

    if(!hasTableSub) {
        return '';
    }

    return `
        ${outputScriptTableSub}

        $(document).on('click', '.type-condition', function() {
            const typeCondition = $(this).attr('data-type-condition');
            const template = $('[data-repeater-item] .type-condition');

            if (typeCondition === 'OR') {
                template
                    .attr('data-type-condition', 'AND')
                    .children()
                    .text('AND')
                    .addClass('badge-soft-primary')
                    .removeClass('badge-soft-warning')
            } else {
                template
                    .attr('data-type-condition', 'OR')
                    .children()
                    .text('OR')
                    .addClass('badge-soft-warning')
                    .removeClass('badge-soft-primary')
            }
        });

        $(document).on('change', '.input-field-compare', function() {
            const template = $(this).closest('[data-repeater-item]');
            const parentType = $(this).parent().data('type');
            const value = $(this).val();

            switch (value) {
                case 'equal':
                case 'not-equal':
                case 'greater-than':
                case 'less-than':
                case 'start-with':
                case 'end-with':
                case 'is-contains':
                case 'not-contains':
                case 'before':
                case 'after':
                    if (parentType === 'date') {
                        $(this).parent().find('input[type="date"]').removeClass('d-none');
                        $(this).parent().find('input[type="number"]').addClass('d-none');
                    } else {
                        $(this).parent().find('.input-field-value').removeClass('d-none');
                        $(this).parent().find('.input-select-value').next().removeClass('d-none');
                    }
                    break;
                case 'before-hours':
                case 'before-days':
                case 'before-months':
                    $(this).parent().find('input[type="date"]').addClass('d-none');
                    $(this).parent().find('input[type="number"]').removeClass('d-none');
                    break;
                default:
                    $(this).parent().find('.input-field-value').addClass('d-none');
                    $(this).parent().find('.input-select-value').next().addClass('d-none');
                    break;
            }
        });

        $(document).on('change', '.input-field-name', function() {
            const template = $(this).closest('[data-repeater-item]');
            const value = $(this).val();

            template.find('[data-follow]').addClass('d-none').removeClass('d-flex');
            template.find(${'`[data-follow=${value}]`'}).removeClass('d-none').addClass('d-flex');
        });

        $(document).on('change', '.input-field-ref-name', function() {
            const template = $(this).closest('[data-repeater-item]');
            const parent = $(this).parent();
            const value = $(this).val();

            parent.find('[data-follow]').addClass('d-none').removeClass('d-flex');
            parent.find(${'`[data-follow=${value}]`'}).removeClass('d-none').addClass('d-flex');
        });
    `;
}

exports.createContentScriptListView = (fields, collectionName, collectionDescription, isServerSide, isApiAddress) => {
    const NAME_COLL_LOWERCASE 		= collectionName.toLowerCase();
    const NAME_COLL_UPPERCASE 		= collectionName.toUpperCase();
    const NAME_COLL_CAPITALIZE 		= collectionName.toCapitalize();
    const FIELD_ID            		= `${NAME_COLL_LOWERCASE}ID`;
    const NAME_COLL                 = collectionName;

    let outputFilterDate    		= '';
    let outputFilterEnum    		= '';
    let outputFilterRange   		= '';

    let outputParamsURL         	= '';
    let outputAssignParamsURL   	= '';
    let outputGetParamsURL      	= '';
	let outputColumnDataTable		= '';
	let outputOptionDataTable		= '';
	let outputFilterDataTable		= '';
    let outputInputSearch           = [];
    let outputChangeQuery       	= [];

    let outputGetParamWithIsStatus  = '';
    let outputGetParamURL           = '';
    let outputFilterWithIsStatus    = '';

    let functionUpdateStatus        = '';

    let placeholder = '`<tr><td><div class="ph-item ph-row set_width_placeholder"><div class="ph-col-12 big"></div></div></td>';
    let getParamURL = '';

    fields.map(field => {
        const input = field.input;

        if(input.type === 'text'){
            outputInputSearch[outputInputSearch.length] = input.name;
            
        }

		// OUTPUT INIT LIBRARY AND FILTER SCRIPT
        if(check.isTrue(input.isShowList)){
            const INPUT_SELECTOR = `#${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}`;
            if (input.widthDatatable && input.widthDatatable.length) { // TẮT SORT Ở REF VÀ IS ORDER
                let disableSortIsOrder = '';
                if (check.isTrue(input.isOrder) || input.ref || check.isTrue(input.isStatus)) {
                    disableSortIsOrder = 'orderable: false';
                }
			    outputColumnDataTable += `{ "data": "${input.name}", "width": "${input.widthDatatable}%", ${disableSortIsOrder} },`;
            } else {
                if (!check.isTrue(input.isApiAddress)) {
                    outputColumnDataTable += `{ "data": "${input.name}" },`;
                }
            }

            switch (input.type) {
                case 'number':

                    if(check.isTrue(input.isEnum)){
                        outputParamsURL += `let ${input.name}Param = urlParams.get('${input.name}');`;
                        outputAssignParamsURL += `${input.name}Param && $('${INPUT_SELECTOR}').val(${input.name}Param).trigger('change');\n`;
                        outputGetParamsURL += `let ${input.name} = $('${INPUT_SELECTOR}').val();`;
                        outputChangeQuery[outputChangeQuery.length] = {
                            query: input.name,
                            value: input.name
                        }

                        outputFilterEnum += `
                            $("${INPUT_SELECTOR}").select2({
                                width: "100%"
                            });
                        `;
                        
                        if (check.isTrue(input.isStatus)) {
                            if (isServerSide) {
                                getParamURL += `
                                    let ${input.name} = getParams('${input.name}');
                                    opts = {
                                        ...opts,
                                        ${input.name}
                                    }
                                `;
                            }

                            outputGetParamURL = `
                                let url = window.location.href;
                                let arrStringOfUrl = url.split('/');
                            
                                let fieldParam = '';
                                let valueParam = '';
                            `;

                            outputFilterWithIsStatus = "${fieldParam}${valueParam}"

                            if (isServerSide) {
                                outputGetParamWithIsStatus += `
                                    if (arrStringOfUrl.includes('${input.name}')) {
                                        let value = arrStringOfUrl[arrStringOfUrl.length - 1];
                                        valueParam = value.charAt(0);
                                        opts = {
                                            ...opts,
                                            ${input.name}: valueParam
                                        }
                                    }
                                `
                            } else {
                                outputGetParamWithIsStatus += `
                                    if (arrStringOfUrl.includes('${input.name}')) {
                                        $('.${input.name}-${NAME_COLL_LOWERCASE}').hide();
                                        fieldParam = '/${input.name}/';
                                        let value = arrStringOfUrl[arrStringOfUrl.length - 1];
                                        valueParam = value.charAt(0);
                                    }
                                `;
                            }
                            
                            functionUpdateStatus += `
                                $(document).on('change', '.check-${input.name}', function(){
                                    let ${FIELD_ID} = $(this).attr('id');
                                    let checked     = $(this).is(':checked');

                                    let status = 1;
                                    if (!checked) {
                                        status = 2;
                                    }

                                    $.ajax({
                                        url: "/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id-v2",
                                        method: 'POST',
                                        data: {
                                            ${NAME_COLL_LOWERCASE}ID: ${FIELD_ID}, ${input.name}: status
                                        },
                                        success: resp => {
                                            if(typeof resp === 'string'){
                                                return AlertCustom({
                                                    title: 'THÔNG BÁO',
                                                    message: 'Bạn không có quyền cập nhật',
                                                    icon: 'warning'
                                                });
                                            }

                                            if (resp.error) {
                                                return AlertCustom({
                                                    title: 'THÔNG BÁO',
                                                    message: resp.message,
                                                    icon: 'warning'
                                                });
                                            }

                                            AlertCustom({
                                                title: 'THÔNG BÁO',
                                                message: 'Thay đổi trạng thái thành công',
                                                icon: 'info'
                                            });
                                        }
                                    })
                                })
                            `;
                        }
                    }

                    if(check.isTrue(input.isCurrency)){
                        outputParamsURL += `
                            let ${input.name}FromNumberParam = urlParams.get('${input.name}FromNumber');
                            let ${input.name}ToNumberParam = urlParams.get('${input.name}ToNumber');
                        `;
                        outputAssignParamsURL += `${input.name}FromNumberParam && ${input.name}FromNumberCleave.setRawValue(${input.name}FromNumberParam);\n`;
                        outputAssignParamsURL += `${input.name}ToNumberParam && ${input.name}ToNumberCleave.setRawValue(${input.name}ToNumberParam);\n`;
                        outputGetParamsURL += `
                            let ${input.name}FromNumber = ${input.name}FromNumberCleave.getRawValue();
                            let ${input.name}ToNumber = ${input.name}ToNumberCleave.getRawValue();
                        `;
                        outputChangeQuery[outputChangeQuery.length] = {
                            query: `${input.name}FromNumber`,
                            value: `${input.name}FromNumber`
                        }
                        outputChangeQuery[outputChangeQuery.length] = {
                            query: `${input.name}ToNumber`,
                            value: `${input.name}ToNumber`
                        }

                        outputFilterRange += `
                            let ${input.name}FromNumberCleave = initOneCleave("#${input.name}FromNumber");
                            let ${input.name}ToNumberCleave = initOneCleave("#${input.name}ToNumber");
                        `;
                    }

                    if (check.isTrue(input.isOrder)) {
                        functionUpdateStatus += `
                            $(document).on('keyup', '.change-${input.name}', function(){
                                let ${FIELD_ID} = $(this).attr('_${NAME_COLL_LOWERCASE}ID');
                                let value       = $(this).val();
                                if (Number.isNaN(Number(value)) || Number(value) < 1) {
                                    return AlertCustom({
                                        title: 'THÔNG BÁO',
                                        message: 'Số không hợp lệ',
                                        icon: 'warning'
                                    }); 
                                }
                                $.ajax({
                                    url: "/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id-v2",
                                    method: 'POST',
                                    data: {
                                        ${NAME_COLL_LOWERCASE}ID: ${FIELD_ID}, ${input.name}: value
                                    },
                                    success: resp => {
                                        if (resp.error) {
                                            return AlertCustom({
                                                title: 'THÔNG BÁO',
                                                message: resp.message,
                                                icon: 'warning'
                                            });
                                        }

                                        AlertCustom({
                                            title: 'THÔNG BÁO',
                                            message: 'Bạn đã thay đổi trạng thái thành công',
                                            icon: 'info'
                                        });
                                    }
                                })
                            })
                        `;
                    }
                    break;
                case 'date':
                    outputParamsURL += `let ${input.name}DateRangeParam = urlParams.get('${input.name}DateRange');`;
                    outputGetParamsURL += `let ${input.name}DateRange = $('${INPUT_SELECTOR}').val();`;
                    outputAssignParamsURL += `${input.name}DateRangeParam && $('${INPUT_SELECTOR}').val(${input.name}DateRangeParam);\n`;
                    outputChangeQuery[outputChangeQuery.length] = {
                        query: `${input.name}DateRange`,
                        value: `${input.name}DateRange`
                    }

                    outputFilterDate += `
                        $("${INPUT_SELECTOR}").daterangepicker({
                            ...languageDateRangePicker
                        })
                    `;
                    break;
                default:
                    break;
            }

            placeholder += `
                <td>
                    <div class="ph-item ph-row set_width_placeholder">
                        <div class=" ph-col-12 big">
                        </div>
                    </div>
                </td>
            `;
        }
    });

    placeholder += '</tr>`';

	if(!isServerSide){

        if(outputFilterEnum || outputFilterRange || outputFilterDate){
            let urlFilter = "`/"+NAME_COLL_LOWERCASE+"/list-"+NAME_COLL_LOWERCASE + outputFilterWithIsStatus +"`";

            outputFilterDataTable = `
                ${outputFilterRange}
                let urlParams = new URLSearchParams(location.search);

                ${outputGetParamURL}
                ${outputGetParamWithIsStatus}

                ${outputParamsURL}
                ${outputAssignParamsURL}
                $('.btn-filter-${NAME_COLL_LOWERCASE}').on('click', function () {
                    ${outputGetParamsURL}
                    ${outputChangeQuery.map(item => `
                    changeQuery({
                        query: "${item.query}",
                        value: ${item.value},
                        wait: true,
                        urlParams
                    })`)}
                    changeQuery({
                        query: "typeGetList",
                        value: "FILTER",
                        url: ${urlFilter},
                        wait: false,
                        urlParams
                    })
                });

                ${outputFilterEnum}
                ${outputFilterDate ? (`
                    ${outputFilterDate}
                    $('input[data-picker="datefilter"]').on('apply.daterangepicker', function(ev, picker) {
                        $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
                    });
                    $('input[data-picker="datefilter"]').on('cancel.daterangepicker', function(ev, picker) {
                        $(this).val('');
                    });
                `) : ''}
            `;
        }

	} else{
		outputOptionDataTable = `
			"processing": true,
			"serverSide": true,
			"ajax": {
				"type": "POST",
				"url": '/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}-server-side',
				"dataType": "json",
				data: d => {
                    optSortDataTable = d;
                    return {
                        ...d,
                        ...opts
                    }
                }
			},
			"columns": [
				{ "data": "index", "width": "5%" },
				{ "data": "indexSTT", "width": "5%", orderable: false },
				${outputColumnDataTable}
                ${isApiAddress ? '{ "data": "address", "width": "10%", orderable: false },': ''}
                { "data": "createAt" }
			],
		`;

		outputFilterDataTable = `
            function checkFilterOfRef(input) {
                let ref = $(input).attr('_ref');
                let class_ref = '';
                let refID = '';
                if (ref) {
                    class_ref = "." + ref + "ID";
                    refID = ref + "ID";
                } else {
                    ref = '';
                }
    
                return {
                    ref: refID,
                    class_ref,
                    coll: ref
                };
            }

            $(document).on('click', '.btn-add-filter', function() {
                const tid = randomStringFixLengthCode(15);
                const { class_ref, ref } = checkFilterOfRef(this);

                const template = $('[data-repeater-item].d-none'+ class_ref)
                    .clone()
                    .removeClass('d-none')
                    .attr('__tid', tid);

                // Append condition field
                $('[data-repeater-list="condition'+ ref +'"]').append(template);

                // Set select 2
                template.find('.input-field-compare, .input-select-value').each((i, elem) => {
                    $(elem).select2({
                        dropdownParent: template,
                        width: '100%'
                    });
                })

                template.find('.input-field-name, .input-field-ref-name').select2({
                    dropdownParent: template,
                    width: "100%"
                });

                if ($('[data-repeater-item]:not(.d-none)'+ class_ref).length > 1) {
                    template.find('.line-condition').removeClass('d-none');
                }
            });
            $('.btn-add-filter').trigger('click');

            $(document).on('click', '.type-condition', function() {
                const { class_ref } = checkFilterOfRef(this);
                const typeCondition = $(this).attr('data-type-condition');
                const template = $('[data-repeater-item] .type-condition' + class_ref);
    
                if (typeCondition === 'OR') {
                    template
                        .attr('data-type-condition', 'AND')
                        .children()
                        .text('AND')
                        .addClass('badge-soft-primary')
                        .removeClass('badge-soft-warning')
                } else {
                    template
                        .attr('data-type-condition', 'OR')
                        .children()
                        .text('OR')
                        .addClass('badge-soft-warning')
                        .removeClass('badge-soft-primary')
                }
            });

            $(document).on('change', '.input-field-compare', function() {
                const template = $(this).closest('[data-repeater-item]');
                const parentType = $(this).parent().data('type');
                const value = $(this).val();

                switch (value) {
                    case 'equal':
                    case 'not-equal':
                    case 'greater-than':
                    case 'less-than':
                    case 'start-with':
                    case 'end-with':
                    case 'is-contains':
                    case 'not-contains':
                    case 'before':
                    case 'after':
                        if(parentType === 'date'){
                            $(this).parent().find('input[type="date"]').removeClass('d-none');
                            $(this).parent().find('input[type="number"]').addClass('d-none');
                        } else{
                            $(this).parent().find('.input-field-value').removeClass('d-none');
                            $(this).parent().find('.input-select-value').next().removeClass('d-none');
                        }
                        break;
                    case 'before-hours':
                    case 'before-days':
                    case 'before-months':
                        $(this).parent().find('input[type="date"]').addClass('d-none');
                        $(this).parent().find('input[type="number"]').removeClass('d-none');
                        break;
                    default:
                        $(this).parent().find('.input-field-value').addClass('d-none');
                        $(this).parent().find('.input-select-value').next().addClass('d-none');
                        break;
                }
            });

            $(document).on('change', '.input-field-name', function() {
                const template = $(this).closest('[data-repeater-item]');
                const value = $(this).val();

                template.find('[data-follow]').addClass('d-none').removeClass('d-flex');
                template.find(${'`[data-follow=${value}]`'}).removeClass('d-none').addClass('d-flex');
            });

            $(document).on('change', '.input-field-ref-name', function() {
                const template = $(this).closest('[data-repeater-item]');
                const parent = $(this).parent();
                const value = $(this).val();

                parent.find('[data-follow]').addClass('d-none').removeClass('d-flex');
                parent.find(${'`[data-follow=${value}]`'}).removeClass('d-none').addClass('d-flex');
            });

            $(document).on('click', '.btn-apply-filter', function() {
                const { class_ref, coll } = checkFilterOfRef(this);
                const conditions = $('[data-repeater-item]:not(.d-none)');
                opts.filter = [];
    
                conditions.each((i, condition) => {
                    let fieldName = $(condition).find('.input-field-name').val();
                    let type = $(condition).find('.input-field-name').find(":selected").data('type');
                    let fieldCondition = $(condition).find(${'`[data-follow=${fieldName}]`'});
    
                    if (type && fieldName) {
                        if(type === 'ref'){
                            let fieldRefName = fieldCondition.find('.input-field-ref-name').val();
                            let typeFieldRef = fieldCondition.find('.input-field-ref-name').find(":selected").data('type');
                            let fieldRefCondition = fieldCondition.find(${'`[data-follow=${fieldRefName}]`'});
                            let cond = fieldRefCondition.find('.input-field-compare').val();
                            let value = fieldRefCondition.find('.input-field-value:not(.d-none), .input-select-value').val();
    
                            opts.filter = [...opts.filter, {
                                type,
                                fieldRefName: fieldName,
                                ref: {
                                    type: typeFieldRef,
                                    fieldName: fieldRefName,
                                    cond,
                                    value
                                }
                            }]
                        } else{
                            let cond = fieldCondition.find('.input-field-compare').val();
                            let value = fieldCondition.find('.input-field-value:not(.d-none), .input-select-value').val();
    
                            opts.filter = [...opts.filter, {
                                type,
                                fieldName: fieldName === 'rootCreateAt' ? 'createAt' : fieldName,
                                cond,
                                value
                            }]
                        }
                    }
    
                })

                if (class_ref) { // FILTER DYNAMIC IMPORT
                    opts.condition = $('[data-repeater-item]:not(.d-none) .type-condition' + class_ref).attr('data-type-condition');
                    ajaxFilterDynamicImport(coll);
                } else { // DATATABLE
                    $('.modal-backdrop').addClass('unblur');
                    opts.condition = $('[data-repeater-item]:not(.d-none) .type-condition').attr('data-type-condition');
                    dataTable.ajax.reload();
                }
            })

            $('.input-search-text').on('keypress', function (e) {
                if(e.which == 13) {
                    opts.keyword = $(this).val();
                    dataTable.ajax.reload();
                }
            });

            $('.btn-filter').on('click', function () {
                opts.keyword = $('.input-search-text').val();
                dataTable.ajax.reload();
            });

            $(document).on('click', '.btn-discard-filter', function() {
                const {
                    class_ref,
                    coll
                } = checkFilterOfRef(this);

                opts = {};
                if (class_ref) { // FILTER DYNAMIC IMPORT
                    ajaxFilterDynamicImport(coll);
                } else { // DATATABLE
                    dataTable.ajax.reload();
                    $('.modal-backdrop').addClass('unblur');
                    $('[data-repeater-item]:not(.d-none)').remove();
                    $('.btn-add-filter').trigger('click');
                }
            });

            $('#offcanvasRight').on('hide.bs.offcanvas', function () {
                $('.modal-backdrop').removeClass('unblur');
            });

            $(document).on('click', '.status-${NAME_COLL_LOWERCASE}-choice', function() {
                let valueChoice = $(this).attr('_value');
                let keyChoice   = $(this).attr('_key');
    
                if (keyChoice && valueChoice) {
                    opts.objFilterStatic = {
                        [keyChoice]: valueChoice
                    }
                   
                    dataTable.ajax.reload();
                } else {
                    opts = {};
                    dataTable.ajax.reload();
                }
            })
		`;
	}

    let outputtedFile = `
        <script>
            $(document).ready(function(){

                initDropify('#file__excel');

				${isServerSide ? 'let opts = {};' : ''}
                ${getParamURL}

				${isServerSide ? `${outputGetParamURL}` : ''}
				${isServerSide ? `${outputGetParamWithIsStatus}` : ''}

                let optSortDataTable = {};
				const dataTable = $('#tableList${NAME_COLL_CAPITALIZE}').DataTable({
                    'iDisplayLength': 25,
                    "aaSorting": [],
                    ...languageDataTable,
					${outputOptionDataTable}
                });
                ${outputFilterDataTable}
                $(document).on('click', '.btn-remove-${NAME_COLL_LOWERCASE}', async function(){
                    const ${FIELD_ID} = $(this).attr('__${FIELD_ID}');

                    await ConfirmCustomAjax({ 
                        title: 'Bạn có chắc chắn muốn xoá ${collectionDescription || NAME_COLL_UPPERCASE}?',
                        icon: 'question',
                        cb: result => {
                            const { error, message } = result.value;

                            if(error) {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: message,
                                    icon: 'warning'
                                });
                            }

                            $(this).closest('tr').remove();
                            AlertCustom({
                                title: 'THÔNG BÁO',
                                message: 'Xoá ${collectionDescription || NAME_COLL_UPPERCASE} thành công',
                                icon: 'info'
                            });
                        },
                        preConfirm: () => {
                            if(!${FIELD_ID}){
                                return AlertCustom({ 
                                    title: 'THÔNG BÁO',
                                    message: 'Không thể xoá ${collectionDescription || NAME_COLL_UPPERCASE} vui lòng thử reload lại trang',
                                    icon: 'warning'
                                });
                            }

                            return $.ajax({
                                type: "DELETE",
                                url: "/${NAME_COLL_LOWERCASE}/delete/" + ${FIELD_ID},
                            })
                        }
                    });

                });

                function showButtonAction() {
                    let checkItemChecked = $('.check-record.checked');
                    if (checkItemChecked.length) {
                        $('.action-${NAME_COLL_LOWERCASE}').attr('disabled', false);
                    } else {
                        $('.action-${NAME_COLL_LOWERCASE}').attr('disabled', true);
                    }
                };

                $(document).on('change', '.check-all-record', function() {
                    let check = $(this).is(':checked');
                    if (check) {
                        $('.check-record').each((index, elem) => { 
                            $(elem).prop('checked', true);
                            $(elem).addClass('checked');
                        });
                    } else {
                        $('.check-record').each((index, elem) => { 
                            $(elem).prop('checked', false);
                            $(elem).removeClass('checked');
                        });
                    }
                    showButtonAction()
                })

                $(document).on('change', '.check-record', function() {
                    let check = $(this).is(':checked');
                    $('.check-all-record').prop('checked', false);
                    if (check) {
                        $(this).addClass('checked');
                    } else {
                        $(this).removeClass('checked');
                    }
                    showButtonAction()
                });

                $(document).on('click', '.action-${NAME_COLL_LOWERCASE}', function() {
                    let checkItemChecked = $('.check-record.checked');
                    $('.show-clip-board').addClass('d-none');

                    if (checkItemChecked.length == 1) {
                        $('.update-${NAME_COLL_LOWERCASE}').removeClass('d-none');
                        $('.delete-${NAME_COLL_LOWERCASE}').removeClass('d-none');
                    } else if (checkItemChecked.length > 1) {
                        $('.update-${NAME_COLL_LOWERCASE}').addClass('d-none');
                        $('.delete-${NAME_COLL_LOWERCASE}').removeClass('d-none');
                    } else {
                        $('.update-${NAME_COLL_LOWERCASE}').addClass('d-none');
                        $('.delete-${NAME_COLL_LOWERCASE}').addClass('d-none');
                    }
                })

                $(document).on('click', '.update-${NAME_COLL_LOWERCASE}', function(e) {
                    e.preventDefault();
                    let checkItemChecked = $('.check-record.checked');
                    if (checkItemChecked.length > 1 || checkItemChecked.length == 0) { 
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Bạn chỉ có thể chỉnh sửa một dữ liệu',
                            icon: 'warning'
                        });
                    }

                    let ${NAME_COLL_LOWERCASE}ID = $(checkItemChecked[0]).attr('id');
                    location.href = '/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=' + ${NAME_COLL_LOWERCASE}ID;
                })

                $(document).on('click', '.delete-${NAME_COLL_LOWERCASE}', async function(e) {
                    e.preventDefault();
                    let checkItemChecked = $('.check-record.checked');
                    if (checkItemChecked.length == 0) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Bạn phải chọn ít nhất một dữ liệu để xóa',
                            icon: 'warning'
                        });
                    }

                    let listItemID = [];
                    $('.check-record.checked').each((index, elem) => {
                        let ${NAME_COLL_LOWERCASE}ID = $(elem).attr('id');
                        listItemID= [
                            ...listItemID,
                            ${NAME_COLL_LOWERCASE}ID
                        ]
                    })

                    await ConfirmCustomAjax({
                        title: 'Bạn có chắc chắn muốn xoá?',
                        icon: 'question',
                        cb: result => {
                            const {
                                error,
                                message
                            } = result.value;

                            if(typeof result.value === 'string'){
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: 'Bạn không có quyền xóa',
                                    icon: 'warning'
                                });
                            }

                            if (error) {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: message,
                                    icon: 'warning'
                                });
                            }

                            setTimeout(() => window.location.reload(), 1500);
                            AlertCustom({
                                title: 'THÔNG BÁO',
                                message: 'Xoá thành công',
                                icon: 'info'
                            });
                        },
                        preConfirm: () => {
                            if (!listItemID.length) {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: 'Không thể xoá vui lòng thử reload lại trang',
                                    icon: 'warning'
                                });
                            }

                            return $.ajax({
                                type: "POST",
                                url: "/${NAME_COLL_LOWERCASE}/delete-${NAME_COLL_LOWERCASE}-by-list-id",
                                data: {
                                    ${NAME_COLL_LOWERCASE}ID: listItemID
                                }
                            })
                        }
                    });
                })

                function changeCallAjaxGetHistory(arrayChoiced) {
                    arrayChoiced && arrayChoiced.length && arrayChoiced.map(item => {
                        $('.check-field-' + item).trigger('click')
                    })
                }
        
                let arrayItemHistoryChoice = []; // LẤY HISTORY ITEM ĐÃ CHỌN
                let nameOfParentColl = ''; // TÊN CỦA COLL CHỌN EXPORT
                let arrayDataEnum    = []; // DANH SÁCH DATAENUM VS ISSTATUS

                function ajaxGetFieldColl({
                    nameColl, type, input, refFrom, countRefBefore, fieldID, clear
                }) {
                    $.ajax({
                        url: '/get-info-coll?nameColl=' + nameColl + '&isExport=true',
                        method: 'GET',
                        success: resp => {
                            if (!resp.error) {
                                let listField = '';
                                if (type == 'origin') {
                                    if (resp.listHistoryChoice) {
                                        arrayItemHistoryChoice = resp.listHistoryChoice.list_type_coll;
                                    }
                                }
                                let arrayChoiced = [];
                                resp.data.map(item => {
                                    let ref = '';
                                    let icon = '';
                                    let countRef = (type == 'origin') ? 1 : countRefBefore;
                                    let classParent = (type == 'origin') ? "check-field-coll-parent" : "";
        
                                    let collIsRefFrom = refFrom ? refFrom : '';
                                    let name = item.note ? item.note : item.name;
                                    let nameCollChoice = (resp.collChoice && !resp.collChoice.error && resp.collChoice.data.description) ? resp.collChoice.data.description : resp.collChoice.data.name;
                                    
                                    if (arrayItemHistoryChoice && arrayItemHistoryChoice.length) {
                                        if (arrayItemHistoryChoice.includes(item._id)) {
                                            arrayChoiced = [
                                                ...arrayChoiced,
                                                item._id
                                            ]
                                        } else {
                                            if (type == 'populate') {
                                                arrayChoiced = [
                                                    ...arrayChoiced,
                                                    item._id
                                                ]
                                            }
                                        }
                                    } else { // LOẠI POPULATE THÌ CHO SELECT ALL
                                        if (type == 'populate') {
                                            arrayChoiced = [
                                                ...arrayChoiced,
                                                item._id
                                            ]
                                        }
                                    }

                                    let dataEnum = '';
                                    if (item.isStatus) {
                                        dataEnum += item.dataEnum.map(isStatus => isStatus.title);
                                        arrayDataEnum = [
                                            ...arrayDataEnum,
                                            {
                                                _id: item._id,
                                                dataEnum: item.dataEnum
                                            }
                                        ]
                                    }

                                    if (item.ref) {
                                        ref = item.ref;
                                        let checkClassRefWasShowed = $('.ref-' + item.ref);
                                        if (!checkClassRefWasShowed.length) {
                                            const COUNT_CAN_POPULATE = 3;
                                            if (countRef < COUNT_CAN_POPULATE) {
                                                icon = '<i class="not-check-all-field far fa-star" _collID = "' + item._id + '" style="margin-left: 5px;font-size: 12px;"></i>';
                                                listField += '<div style="padding-bottom: 0px;" class="list-group-item list-group-item-' + item._id + ' checkbox checkbox-success"> <div class="row"><div class="col-lg-8">';
                                                let input = '<input _nameCollChoice = "' + nameCollChoice + '"  _dataEnum = "' + dataEnum + '" _type = "' + item.type + '"  _countRef ="' + countRef + '" _note="' + name + '" _refFrom = "' + collIsRefFrom + '" _typeColl ="' + type + '" _coll="' + nameColl + '" _ref="' + ref + '" id="' + item._id + '" type="checkbox" class="item-coll-' + nameColl + ' check-field-coll ' + classParent + ' check-field-' + item._id + ' ref-' + ref + '" _value="' + item.name + '"><label class="label-export" for="' + item._id + '">' + name + icon + '</label>'
                                                listField += input + ' </div><div class="col-lg-4"><span class="' + nameColl + "-" + item.name + '-badge badge-' + item.ref + ' badge rounded-pill badge-outline-warning">Chọn</span></div></div></div>'
                                            }
                                        }
                                    } else {
                                        listField += '<div style="padding-bottom: 0px;" class="list-group-item list-group-item-' + item._id + ' checkbox checkbox-success"> <div class="row"><div class="col-lg-8">';
                                        let input = '<input _nameCollChoice = "' + nameCollChoice + '"  _dataEnum = "' + dataEnum + '" _type = "' + item.type + '" _countRef ="' + countRef + '" _note="' + name + '" _refFrom = "' + collIsRefFrom + '" _typeColl ="' + type + '" _coll="' + nameColl + '" _ref="' + ref + '" id="' + item._id + '" type="checkbox" class="item-coll-' + nameColl + ' check-field-coll ' + classParent + ' check-field-' + item._id + ' ref-' + ref + '" _value="' + item.name + '"><label class="label-export" for="' + item._id + '">' + name + icon + '</label>'
                                        listField += input + ' </div><div class="col-lg-4"><span class="' + nameColl + "-" + item.name + '-badge badge rounded-pill badge-outline-warning">Chọn</span></div></div></div>'
                                        // listField += '<div class="list-group-item checkbox checkbox-success"><input _countRef ="' + countRef + '" _note="' + name + '" _refFrom = "' + collIsRefFrom + '" _typeColl ="' + type + '" _coll="' + nameColl + '" _ref="' + ref + '" id="' + item._id + '" type="checkbox" class="check-field-coll '+ classParent +'" _value="' + item.name + '"><label for="' + item._id + '">' + name + icon + '</label></div>';
                                    }
                                });

                                if (type == 'origin') {
                                    nameOfParentColl = resp.collChoice.data.description
                                    $('.totalItem').text(resp.data.length);
                                    $('.list-field-coll-print').empty();
                                    $('.list-field-coll-print').append(listField);
                                } else {
                                    let dataToAppend = '<ul class= "' + nameColl + ' list-group list-group-flush" style="padding-left: 20px;">' + listField + '</ul>';
                                    $(input).parents('.list-group-item-'+ fieldID).append(dataToAppend);
                                }
                                if (!clear) {
                                    changeCallAjaxGetHistory(arrayChoiced);
                                }
                            }
                        }
                    }).done(() => {
                        dragula([document.querySelector('.list-field-coll-print')])
                    });
                }

                $(document).on('click', '.print-${NAME_COLL_LOWERCASE}', function() {
                    $('.list-field-coll-print').empty();

                    ajaxGetFieldColl({
                        nameColl: '${NAME_COLL}',
                        type: 'origin'
                    });
                    $('.btn-export-excel').removeClass('d-none');
                    $('.show-clip-board').addClass('d-none');
                    $('.option-choose-export').removeClass('d-none');
                })

                function changeCountItemCheck() {
                    let listItemChecked = $('.check-field-coll.checked');
                    let listTotalItem   = $('.check-field-coll');
                    $('.countItemChoice').text(listItemChecked.length);
                    $('.totalItem').text(listTotalItem.length);
                }

                function clickShowField(input) {
                    let ref = $(input).attr('_ref');
                    let refFrom = $(input).attr('_coll');
                    let _countRef = $(input).attr('_countRef');
                    let value = $(input).attr('_value');
                    let fieldID = $(input).attr('id');
                    let check = $(input).is(':checked');
                    let countRefCanPopulate = Number(_countRef) + 1;
        
                    return {
                        ref, refFrom, _countRef, value, fieldID, check, countRefCanPopulate
                    }
                }
        
                function changeCheckField(check, ref, countRefCanPopulate, fieldID, refFrom, input, value) {
                    if (check) {
                        if (countRefCanPopulate <= 3) {
                            if (ref) {
                                ajaxGetFieldColl({
                                    nameColl: ref,
                                    type: 'populate',
                                    input: input,
                                    refFrom: refFrom,
                                    countRefBefore: countRefCanPopulate,
                                    fieldID: fieldID,
                                });
                            }
                        }
                        $(input).addClass('checked');
                        $('.' + refFrom + '-' + value + '-badge').removeClass('badge-outline-warning');
                        $('.' + refFrom + '-' + value + '-badge').addClass('badge-outline-success');
                        $('.' + refFrom + '-' + value + '-badge').text('Đã chọn');
                    } else {
                        $(input).removeClass('checked');

                        if (refFrom) {
                            let listItem = $('.item-coll-' + refFrom +'.checked');
                            if (!listItem.length) {
                                $('.ref-' + refFrom).prop('checked', false);
                                $('.' + refFrom).remove();
                                $('.badge-' + refFrom).removeClass('badge-outline-success');
                                $('.badge-' + refFrom).addClass('badge-outline-warning');
                                $('.badge-' + refFrom).text('Chọn');
                            }
                        }

                        if (ref) {
                            $('.' + ref).remove();
                        }
                        $('.' + refFrom + '-' + value + '-badge').removeClass('badge-outline-success');
                        $('.' + refFrom + '-' + value + '-badge').addClass('badge-outline-warning');
                        $('.' + refFrom + '-' + value + '-badge').text('Chọn');
                    }
                    changeCountItemCheck();
                }

                $(document).on('click', '.check-field-coll', function() {
                    let { ref, refFrom, _countRef, value, fieldID, check, countRefCanPopulate } = clickShowField(this);
                    changeCheckField(check, ref, countRefCanPopulate, fieldID, refFrom, this, value);
                });

                $(document).on('click', '.btn-clear-all-field-choice', function() {
                    ajaxGetFieldColl( {
                        nameColl: '${NAME_COLL}',
                        type: 'origin',
                        clear: 'clearAll'
                    });
                    $('.countItemChoice').text('0');
                })

                $(document).on('click', '.btn-export-excel', function() {
                    const CHOOSE_CSV = 1;
                    const CHOOSE_XLSX = 2;
                    const CHOOSE_VALID = [ CHOOSE_CSV, CHOOSE_XLSX ]

                    let arrayItemChecked = [];
                    let checkRecordChecked = $('.check-record.checked');
                    if (checkRecordChecked && checkRecordChecked.length) {
                        checkRecordChecked.each((index, elem) => {
                            let ${NAME_COLL_LOWERCASE}ID = $(elem).attr('id');
                            arrayItemChecked = [
                                ...arrayItemChecked,
                                ${NAME_COLL_LOWERCASE}ID
                            ]
                        })
                    }

                    $('.option-choose-export').addClass('d-none');

                    let checkItemChecked = $('.check-field-coll.checked');
                    let chooseCSV = $('.chooseCSV:checked').val();

                    if (Number.isNaN(Number(chooseCSV)) || !CHOOSE_VALID.includes(Number(chooseCSV))) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: "Loại Xuất không hợp lệ",
                            icon: 'warning'
                        }); 
                    }

                    if (checkItemChecked.length == 0) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Bạn phải chọn ít nhất một thuộc tính',
                            icon: 'warning'
                        });
                    }

                    let listItemID = [];
                    $('.check-field-coll.checked').each((index, elem) => {
                        let name  = $(elem).attr('_value');
                        let coll  = $(elem).attr('_coll');
                        let type  = $(elem).attr('_typeColl');
                        let ref  = $(elem).attr('_ref');
                        let refFrom = $(elem).attr('_refFrom');
                        let note = $(elem).attr('_note');
                        let fieldID = $(elem).attr('id');
                        let typeVar = $(elem).attr('_type');
                        let nameCollChoice = $(elem).attr('_nameCollChoice');

                        let dataEnum = [];
                        arrayDataEnum && arrayDataEnum.length && arrayDataEnum.map(item => {
                            if (item._id == fieldID) {
                                dataEnum = item.dataEnum
                            }
                        })

                        let object = name;
                        if (type == 'populate') {
                            object = coll + '.' + name;
                        }

                        listItemID = [...listItemID, {
                            name, coll, ref, refFrom, note, fieldID: fieldID, typeVar, dataEnum, nameCollChoice
                        }]
                    })

                    $.ajax({
                        url: '/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}-excel',
                        method: 'POST',
                        data: {
                            listItemExport: listItemID, 
                            chooseCSV, 
                            filter: opts.filter, 
                            objFilterStatic: opts.objFilterStatic, 
                            condition: opts.condition, 
                            nameOfParentColl,
                            ...optSortDataTable,
                            keyword: opts.keyword,
                            arrayItemChecked
                        },
                        success: resp => {
                            if (resp.error) {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: resp.message,
                                    icon: 'warning'
                                }); 
                            } else {
                                if (chooseCSV == CHOOSE_CSV) {
                                    $('.show-clip-board').removeClass('d-none');
                                    $('.show-url-export').val(resp.domain + resp.data);
                                    $('.list-field-coll-print').empty();
                                    $('.btn-export-excel').addClass('d-none');
                                } else {
                                    return AlertCustom({
                                        title: 'THÔNG BÁO',
                                        message: 'Bạn đã cấu hình EXPORT thành công',
                                        icon: 'success'
                                    });
                                }
                            }
                        }
                    })
                });

                $(document).on('click', '.download-excel-export', function() {

                    $('.loading-excel-export').removeClass('d-none');
                    let arrayItemChecked = [];
                    let checkRecordChecked = $('.check-record.checked');
                    if (checkRecordChecked && checkRecordChecked.length) {
                        checkRecordChecked.each((index, elem) => {
                            let limit_kpi_configID = $(elem).attr('id');
                            arrayItemChecked = [
                                ...arrayItemChecked,
                                limit_kpi_configID
                            ]
                        })
                    }
        
                    $.ajax({
                        url: '/${NAME_COLL_LOWERCASE}/dowload-${NAME_COLL_LOWERCASE}-excel-export',
                        method: 'POST',
                        data: {
                            filter: opts.filter,
                            objFilterStatic: opts.objFilterStatic,
                            condition: opts.condition,
                            ...optSortDataTable,
                            keyword: opts.keyword,
                            arrayItemChecked
                        },
                        success: resp => {
                            if (resp.error) {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: resp.message,
                                    icon: 'warning'
                                });
                            } else {
                                window.location.href = resp.data;
                            }
                        }
                    }).done(() => $('.loading-excel-export').addClass('d-none'))
                });

                //=======================IMPORT EXCEL=======================
                
                // FUNCTION: TRẢ VỀ DATA DYNAMIC ĐÃ FILTER
                function getDataDynamic(resp, listField, dataDynamicHistory) {
                    let dataDynamic = [];
                    resp.data && resp.data.length && resp.data.map(item => {
                        listField.map((elem, index) => {
                            let value = item[elem];
                            if (dataDynamicHistory && dataDynamicHistory.length) { // CHECK HISTORY IMPORT
                                if (!dataDynamicHistory.includes(value)) {
                                    value = '';
                                }
                            } 

                            if (value) {
                                if (!dataDynamic.length) {
                                    dataDynamic = [{
                                        variable: elem,
                                        dataDynamic: [item[elem]]
                                    }];
                                } else {
                                    let mark = false;
                                    dataDynamic.map((value, index) => {
                                        if (value.variable == elem) {
                                            mark = true;
                                            dataDynamic[index].dataDynamic = [
                                                ...dataDynamic[index].dataDynamic,
                                                item[elem]
                                            ]
                                        }
                                    });

                                    if (!mark) {
                                        dataDynamic = [
                                            ...dataDynamic,
                                            {
                                                variable: elem,
                                                dataDynamic: [item[elem]]
                                            }
                                        ];
                                    }
                                }
                            }
                        });
                    });
                    return { dataDynamic };
                }
        
                // FUNCTION: AJAX BỘ LỌC THEO COLL
                let arrayValueDynamicChoice = [];
                let conditionDeleteImport = {};
                function ajaxFilterDynamicImport(ref, dataDynamicHistory) {
                    if (ref == '${NAME_COLL}') {
                        conditionDeleteImport = opts;
                        opts = {};
                    } else {
                        $.ajax({
                            url: '/' + ref + '/list-'+ ref +'-import',
                            method: 'POST',
                            data: {
                                start: 0,
                                length: 100,
                                ...opts
                            },
                            success: resp => {
                                if (!resp.error) {
                                    let {
                                        listField
                                    } = checkListFieldRefDynamic(ref);
                                    
                                    arrayValueDynamicChoice = arrayValueDynamicChoice.filter(item => item.coll != ref);
                                    let {
                                        dataDynamic
                                    } = getDataDynamic(resp, listField, dataDynamicHistory);
            
                                    if (dataDynamicHistory && dataDynamicHistory.length) {
                                        arrayValueDynamicChoice = [ // DATA DYNAMIC HISTORY
                                            ...arrayValueDynamicChoice,
                                            {
                                                coll: ref,
                                                dataDynamic
                                            }
                                        ];
                                    } else {
                                        arrayValueDynamicChoice = [  // DATA DYNAMIC FILTER
                                            ...arrayValueDynamicChoice,
                                            {
                                                coll: ref,
                                                dataDynamic
                                            }
                                        ];
                                    }
                                    
                                    var randomColor = Math.floor(Math.random()*16777215).toString(16);
                                    if (dataDynamic && dataDynamic.length) {
                                        $('.span-' + ref).text(' (' + dataDynamic[0].dataDynamic.length + ')');
                                        $('.span-' + ref).css('color', '#'+randomColor);
                                    } else {
                                        $('.span-' + ref).text(' (0)');
                                        $('.span-' + ref).css('color', '#'+randomColor);
                                    }
                                }
                                opts = {};
                            }
                        })
                    }
                }

                // FUNCTION: BỘ LỌC THEO COLL
                function ajaxGetListFieldAllColl(coll) {
                    $.ajax({
                        url: '/filter-by-coll?nameColl=' + coll +'&offcanvasID=' + coll,
                        method: 'GET',
                        success: resp => {
                            if (!resp.error) {
                                $('.list-filter-import').append(resp.data);
                            }
                        }
                    })
                }

                // FUNCTION: SHOW BỘ LỌC DYNAMIC
                function filterDynamicValue(coll) {
                    let appendFilter = '<div class="row"><div class="col-lg-8"><div class="input-group"><input type="text" class="form-control input-search-text input-search-text-' + coll + '" autocomplete="off" placeholder="Tìm kiếm..."><button class="input-group-text btn-filter-dynamic-coll" _coll="' + coll + '"><i class="ti-search"></i></button></div></div>';
                    let filter = '<div class="col-lg-4"><button class="btn btn-outline-secondary me-2" type="button" data-bs-toggle="modal" data-bs-target="#'+ coll +'ID" ><i class="mdi mdi-filter-variant"></i> Bộ lọc</button></div></div>';
                    ajaxGetListFieldAllColl(coll);
                    return {
                        inputSearch: appendFilter + filter,
                    }
                }

                function checkDataDynamicHistory(resp) {
                    for (let item of resp.data) {
                        if (resp.listHistoryChoice && resp.listHistoryChoice.length) {
                            resp.listHistoryChoice.map(historyImport => {
                                if (historyImport.fieldID == item._id || historyImport.nameFieldRef == item.name) {
                                    if (historyImport.dataDynamic.length) {
                                        ajaxFilterDynamicImport(item.ref, historyImport.dataDynamic);
                                    }
                                }
                            });
                        }
                    }
                }

                // FUNCTION: TRẢ VỀ INPUT REF
                function getInputRef({
                    _id,
                    nameCollChoice,
                    type,
                    countRef,
                    description,
                    name,
                    nameColl,
                    ref,
                    dataEnum,
                    classParent,
                    collIsRefFrom,
                    TYPE_CHOICE_VALUE_REF,
                    dataDynamic
                }) {
                    let checkClassRefWasShowed = $('.ref-' + ref);
                    if (!checkClassRefWasShowed.length) {
                        const COUNT_CAN_POPULATE = 2;
                        let FIELD_REF = '';
                        if (countRef < COUNT_CAN_POPULATE) {
                            if (!TYPE_CHOICE_VALUE_REF || TYPE_CHOICE_VALUE_REF == 'static') {
                                let TYPE_STATIC  = '';
                                let TYPE_DYNAMIC = '';
                                if (dataDynamic && dataDynamic.length) {
                                    TYPE_DYNAMIC = 'selected';
                                } else {
                                    TYPE_STATIC = 'selected';
                                }
                                let inputDataMapping = '<div class = "col-lg-3"><input  id="mapping' + _id + '" _ref="' + ref + '" type="checkbox" class="mapping-data-populate mapping-data-populate-'+ ref +'"><label class="label-export" for="mapping' + _id + '">Dữ liệu ánh xạ</label><input type="text" class="form-control mt-2 input-field-choosed-insert-update-from-' + ref + ' d-none" value=""></div>';

                                let inputSelectChoiceTypePopulate = '<div class = "col-lg-6"><select class="form-select type-choice-preview-ref type-choice-preview-ref-' + ref + '"'
                                inputSelectChoiceTypePopulate += 'id="" _id="'+ _id +'" _ref = "'+ ref +'" data-placeholder="Chọn Loại" style="margin-top: -7px;"><option ' + TYPE_DYNAMIC + ' value="dynamic">DYNAMIC</option><option ' + TYPE_STATIC + ' value="static">STATIC</option></select></div>';
        
                                let icon = '<i class="not-check-all-field far fa-star" _collID = "' + _id + '" style="margin-left: 5px;font-size: 12px;"></i>';
        
                                FIELD_REF += '<div style="padding-bottom: 0px !important;" class="list-group-item list-group-item-import list-group-item-import-' + _id + ' checkbox checkbox-success"> <div class="row"><div class="col-lg-12"> <div class="row">';
        
                                let input = '<div class = "col-lg-3"><input _nameCollChoice = "' + nameCollChoice + '"  _dataEnum = "' +
                                    dataEnum + '" _type = "' + type + '"  _countRef ="' + countRef + '" _note="' + description +
                                    '" _refFrom = "' + collIsRefFrom + '" _typeColl ="' + type + '" _coll="' + nameColl + '" _ref="' +
                                    ref + '" id="' + _id + '" type="checkbox" class="item-coll-import-' + nameColl + ' check-field-coll-import ' +
                                    classParent + ' check-field-import-' + _id + ' ref-import-' + ref + '" _value="' + name +
                                    '"><label class="label-export" for="' + _id + '">' + description + icon + '</label><span class="span-' + ref + '"> </span></div>' +
                                    inputDataMapping + inputSelectChoiceTypePopulate + '</div>';
                                FIELD_REF += input + ' </div></div></div>';
                            }
                        }
        
                        return {
                            FIELD_REF
                        }
                    }
                }

                const isTrue = val => {
                    return val && val !== '' && val !== undefined && val === 'true';
                }

                function setHistoryConditionDeleteDataOld(condition) {
                    if (isTrue(condition.delete)) { // XÓA DATA CŨ
                        $('.input-field-type-delete').val('YES');
        
                        if (isTrue(condition.deleteAll)) { // XÓA TẤT CẢ DỮ LIỆU
                            // console.log("====================XÓA TẤT CẢ DỮ LIỆU====================");
                            $('.input-field-type-delete-all').val('YES');
        
                        } else { // XÓA VỚI ĐIỀU KIỆN
                            // console.log("====================XÓA VỚI ĐIỀU KIỆN====================");
                            $('.input-field-type-delete-all').val('NO');
                            $(".type-change-data-delete-all[value=" + condition.typeChangeData + "]").prop('checked', true);
                          
                            if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                                if (isTrue(condition.checkDownloadDataOld)) {
                                    $('.choice-download-data-old').prop('checked', true);
                                }
                            } else { // INSERT CÁI MỚI
                                // console.log("====================INSERT CÁI MỚI 2====================");
                            }
                            $('.type-change-data-delete-all:checked').trigger('click');
                        }
                        $('.input-field-type-delete-all').trigger('change');
        
                    } else { // KHÔNG XÓA DATA CŨ
                        $('.input-field-type-delete').val('NO');
                        $(".type-change-data-not-delete-all[value=" + condition.typeChangeData + "]").prop('checked', true);
                        
                        if (condition.typeChangeData == 'update') { // KIỂM TRA TỒN TẠI VÀ UPDATE
                            // console.log("====================KIỂM TRA TỒN TẠI VÀ UPDATE====================");
                            
                        } else { // INSERT CÁI MỚI
                            // console.log("====================INSERT CÁI MỚI====================");
                            
                        }
                        $('.type-change-data-not-delete-all:checked').trigger('click');
                    }
                    $('.input-field-type-delete').trigger('change');
                }

                // FUNCTION: CALL AJAX VỚI FIELD REF
                let listFieldOfCollOrigin = [];
                let respOriginImport = {};
                let conditionDeleteData = {}; // CONDITION STEP DELETE DATA OLD

                function ajaxCallGetFieldImport({
                    nameColl, // Tên COLL
                    type, // Origin = Lần đầu load || Populate = Load từ lần 2 trở đi
                    refFrom, // REF từ COLL nào
                    input,
                    countRefBefore, // Số lượng đã REF
                    fieldID,
                    clear,
                    TYPE_CHOICE_VALUE_REF // DYNAMIC || STATIC
                }) {
                    $.ajax({
                        url: '/get-info-coll-import?nameColl=' + nameColl + '&isImport=true',
                        method: 'GET',
                        success: resp => {
                            if (!resp.error) {
                                let listField = '';
                                let arrayChoiced = [];
        
                                if (TYPE_CHOICE_VALUE_REF && TYPE_CHOICE_VALUE_REF == 'dynamic') {
                                    let {
                                        inputSearch
                                    } = filterDynamicValue(resp.collChoice.data.name);
                                    listField += inputSearch;
                                }

                                let list${NAME_COLL_LOWERCASE} = localStorage.getItem('list${NAME_COLL_LOWERCASE}');
                                if (list${NAME_COLL_LOWERCASE}) {
                                    list${NAME_COLL_LOWERCASE} = JSON.parse(list${NAME_COLL_LOWERCASE});
                                }
                             
                                let respAfterCheckOrder = resp.data;
                                if (list${NAME_COLL_LOWERCASE} && list${NAME_COLL_LOWERCASE}.length) { // THAY ĐỔI VỊ TRÍ CỦA FILE IMPORT
                                    respAfterCheckOrder = [];
                                    for (let item of list${NAME_COLL_LOWERCASE}) { 
                                        for (let elem of resp.data) { 
                                            if (elem._id == item.fieldID) {
                                                respAfterCheckOrder = [
                                                    ...respAfterCheckOrder,
                                                    elem
                                                ];
                                            }
                                        }
                                    }
                                }

                                if (resp.listHistoryChoice && resp.listHistoryChoice.length) {
                                    let condition = resp.listHistoryChoice[0] && resp.listHistoryChoice[0].condition && resp.listHistoryChoice[0].condition.conditionDeleteImport;
                                    if (condition) { // SHOW ĐIỀU KIỆN ĐÃ CHỌN
                                        $('.conditionDelete').text("CONDITION: " + condition.condition);
                                        let filterString = '';
                                        condition.filter && condition.filter.length && condition.filter.map(filter => {
                                            filterString += 'fieldName: ' + filter.fieldName + ' - cond: ' + filter.cond + ' - value: ' + filter.value;
                                        });
                                        $('.fieldDelete').text(filterString);
                                    }
                                }
        
                                for (let item of respAfterCheckOrder) {
                                    let ref = '';
                                    let icon = '';
                                    let inputSelectChoiceTypePopulate = '';
        
                                    let countRef = (type == 'origin') ? 1 : countRefBefore;
                                    let classParent = (type == 'origin') ? "check-field-coll-parent" : "";
        
                                    let collIsRefFrom = refFrom ? refFrom : '';
                                    let name = item.note ? item.note : item.name;
                                    let nameCollChoice = (resp.collChoice && !resp.collChoice.error && resp.collChoice.data.description) ? resp.collChoice.data.description : resp.collChoice.data.name;
                                    let collChoiceID = resp.collChoice.data._id;
        
                                    let dataDynamic = [];
                                    let selectedFieldDynamic = ''; // SELECTED FIELD CHỌN DYNAMIC
                                    if (resp.listHistoryChoice && resp.listHistoryChoice.length && type == 'origin') {
                                        let mark = false;
                                        resp.listHistoryChoice.map(historyImport => {
                                            if (historyImport.fieldID == item._id || historyImport.nameFieldRef == item.name) {
                                                mark = true;
                                                dataDynamic = historyImport.dataDynamic;
        
                                                if (!arrayChoiced.includes(item._id)) {
                                                    arrayChoiced = [
                                                        ...arrayChoiced,
                                                        item._id
                                                    ];
                                                }
                                            }
                                        })
        
                                    } else {
                                        if (type == 'populate') {
                                            if (respOriginImport.listHistoryChoice && respOriginImport.listHistoryChoice.length) {
                                                respOriginImport.listHistoryChoice.map(historyImport => {
                                                    if (historyImport.fieldID == item._id || historyImport.nameFieldRef == item.name) {
                                                        arrayChoiced = [
                                                            ...arrayChoiced,
                                                            item._id
                                                        ];
                                                    }
                                                })
                                            }
                                        }
                                    }
        
                                    let dataEnum = '';
                                    if (item.isStatus) {
                                        dataEnum += item.dataEnum.map(isStatus => isStatus.title);
                                        arrayDataEnum = [
                                            ...arrayDataEnum,
                                            {
                                                _id: item._id,
                                                dataEnum: item.dataEnum
                                            }
                                        ]
                                    }
        
                                    
        
                                    if (item.ref) {
                                        let {
                                            FIELD_REF
                                        } = getInputRef({
                                            _id: item._id,
                                            nameCollChoice,
                                            type: item.type,
                                            countRef,
                                            description: name,
                                            name: item.name,
                                            nameColl,
                                            ref: item.ref,
                                            collIsRefFrom,
                                            dataEnum,
                                            classParent,
                                            TYPE_CHOICE_VALUE_REF,
                                            dataDynamic // DYNAMIC || STATIC HISTORY
                                        });
                                        listField += FIELD_REF;
        
                                    } else {
                                        let inputSelectItemOfColl = '';
        
                                        if (countRef > 1 && TYPE_CHOICE_VALUE_REF == 'dynamic') { // CHỌN FIELD REF
                                            let option = '<option value="">Chọn biến</option>';
                                            listFieldOfCollOrigin.map(item => {
                                                let selected = '';
                                                respOriginImport.listHistoryChoice && respOriginImport.listHistoryChoice.length && respOriginImport.listHistoryChoice.map(history => {
                                                    if (history.variableChoice == item.name) {
                                                        selected = 'selected';
                                                    }
                                                });
                                                let name = item.note ? item.note : item.name;
                                                option += '<option '+ selected +'  value="' + item.name + '">' + item.note + '</option>';
                                            });
        
                                            inputSelectItemOfColl = '<div class = "col-lg-6"><select class="form-select field-' + nameColl + '-' + item.name + '-dynamic" data-placeholder="Chọn Loại" style="margin-top: -7px;">' + option + '</select></div>';
                                        }
        
                                        let checked = '';
                                        if (type == 'origin' && resp.listHistoryChoice) {
                                            resp.listHistoryChoice && resp.listHistoryChoice.length && resp.listHistoryChoice.map(history => {
                                                if (history.fieldID == item._id && history.isRequire) {
                                                    checked = 'checked';
                                                }
                                            });
                                        } else if (respOriginImport.listHistoryChoice) {
                                            respOriginImport.listHistoryChoice && respOriginImport.listHistoryChoice.length && respOriginImport.listHistoryChoice.map(history => {
                                                if (history.fieldID == item._id && history.isRequire) {
                                                    checked = 'checked';
                                                }

                                                if (history.mappingRef && history.mappingRef.length) {
                                                    $('.input-field-choosed-insert-update-from-' + history.ref).attr('value', history.mappingRef.join(','));
                                                    $('.mapping-data-populate-'+ history.ref).prop('checked', true);
                                                } 
                                            });
                                        }
        
                                        let inputRequire = '<input '+ checked +' style = "margin-left: 15px;" id="require-' + item._id + '" type="checkbox" class="" _value="' +
                                        item.name + '"><label class="label-export" for="require-' + item._id + '">Require</label>';
        
                                        listField += '<div style="padding-bottom: 0px !important;" class="list-group-item list-group-item-import list-group-item-import-' + item._id + ' checkbox checkbox-success"> <div class="row"><div class="col-lg-4">';
                                        let input = '<input _nameCollChoice = "' + nameCollChoice + '"  _dataEnum = "' + dataEnum + '" _type = "' +
                                            item.type + '" _countRef ="' + countRef + '" _note="' + name + '" _refFrom = "' + collIsRefFrom +
                                            '" _typeColl ="' + type + '" _coll="' + nameColl + '" _ref="' + ref + '" id="' + item._id +
                                            '" type="checkbox" class="item-coll-import-' + nameColl + ' check-field-coll-import ' + classParent +
                                            ' check-field-import-' + item._id + ' ref-import-' + ref + '" _value="' + item.name + '"><label class="label-export" for="' +
                                            item._id + '">' + name + icon + '</label>';
        
                                        listField += input + inputRequire + ' </div>' + inputSelectItemOfColl + '</div></div>';
                                    }
                                };
        
                                if (type == 'origin') {
                                    listFieldOfCollOrigin = resp.data.filter(item => !item.ref);
                                    respOriginImport = resp;
                                    conditionDeleteData = resp.listHistoryChoice && resp.listHistoryChoice.length && resp.listHistoryChoice[0].condition;

                                    setHistoryConditionDeleteDataOld(conditionDeleteData);

                                    $('.totalItem').text(resp.data.length);
                                    $('.list-field-coll-import').empty();
                                    $('.list-field-coll-import').append(listField);
                                } else {
                                    let dataToAppend = '<ul class= "' + nameColl + ' list-group list-group-flush" style="padding-left: 20px;">' + listField + '</ul>';
                                    $(input).parents('.list-group-item-import-' + fieldID).append(dataToAppend);
                                }
                                if (!clear) {
                                    changeCallAjaxGetHistoryImport(arrayChoiced, resp, type);
                                    checkDataDynamicHistory(respOriginImport); // FUNCTION CALL AJAX FIELD REF CHOICE DYNAMIC
                                }
                            }
                        }
                    }).done(() => {
                        dragula([document.querySelector('.list-field-coll-import')])
                    });
                }

                // FUNCTION: LOAD FIELD IMPORT ĐẦU TIÊN
                $(document).on('click', '.setting-excel-preview', function() {
                    $('.list-field-coll-import').empty();
                    ajaxCallGetFieldImport({
                        nameColl: '${NAME_COLL}',
                        type: 'origin',
                    });

                    ajaxGetListFieldAllColl('${NAME_COLL}');
                    $('.btn-export-excel').removeClass('d-none');
                });
        
                function changeCallAjaxGetHistoryImport(arrayChoiced, resp) {
                    arrayChoiced && arrayChoiced.length && arrayChoiced.map(item => {
                        $('.check-field-import-' + item).trigger('click')
                    });
                }

                // FUNCTION: CALL AJAX VỚI FIELD REF
                function changeCheckFieldImport(
                    check, ref, countRefCanPopulate, fieldID, refFrom, input, value, TYPE_CHOICE_VALUE_REF
                ) {
                    if (check) {
                        if (countRefCanPopulate <= 2) {
                            if (ref) {
                                ajaxCallGetFieldImport({
                                    nameColl: ref,
                                    type: 'populate',
                                    input: input,
                                    refFrom: refFrom,
                                    countRefBefore: countRefCanPopulate,
                                    fieldID: fieldID,
                                    TYPE_CHOICE_VALUE_REF
                                });
                            }
                        }
                        $(input).addClass('checked');
                    } else {
                        $(input).removeClass('checked');
        
                        if (refFrom) {
                            let listItem = $('.item-coll-' + refFrom + '.checked');
                            if (!listItem.length) {
                                $('.ref-' + refFrom).prop('checked', false);
                            }
                        }
        
                        if (ref) {
                            $('.' + ref).remove();
                        }
                    }
                }
        
                // FUNCTION: CHECK FIELD IMPORT
                $(document).on('click', '.check-field-coll-import', function() {
                    let {
                        ref,
                        refFrom,
                        _countRef,
                        value,
                        fieldID,
                        check,
                        countRefCanPopulate
                    } = clickShowField(this);
        
                    let TYPE_CHOICE_VALUE_REF;
                    if (check && ref) {
                        TYPE_CHOICE_VALUE_REF = $('.type-choice-preview-ref-' + ref).val();
                        if (!TYPE_CHOICE_VALUE_REF) {
                            $(this).prop('checked', false);
                            return AlertCustom({
                                title: 'THÔNG BÁO',
                                message: 'Bạn phải chọn loại Loại Populate',
                                icon: 'warning'
                            });
                        }
                    }
        
                    changeCheckFieldImport(check, ref, countRefCanPopulate, fieldID, refFrom, this, value, TYPE_CHOICE_VALUE_REF);
                });

                function appendListValueRefColl(listValueDynamic) {
                    let listValueDynamicShow = '';
                    let coll;
        
                    listValueDynamic.map(item => {
                        let input = '<div style="padding-bottom: 0px !important; padding-left: 45px;" class="list-group-item list-group-item-import list-group-item-import- checkbox checkbox-success"> <div class="row"><div class="col-lg-8">';
                        input += '<input _variable = "' + item.variable + '" _coll = "' + item.coll + '" id="' + item.value + '" type="checkbox" class="item-coll-import- check-field-coll-import"><label class="label-export" for="' +
                            item.value + '">' + item.value + '</label>';
                        input += '</div>';
                        listValueDynamicShow += input;
                        coll = item.coll;
                    });
        
                    $('.' + coll).append(listValueDynamicShow);
                }

                function checkListFieldRefDynamic(coll) {
                    let listFieldRefDynamic = $('.item-coll-import-' + coll);
                    let listField = [];
                    if (listFieldRefDynamic && listFieldRefDynamic.length) {
                        listFieldRefDynamic.each((i, elem) => {
                            let nameField = $(elem).attr('_value');
                            listField = [
                                ...listField,
                                nameField
                            ];
                        });
                    }
                    return {
                        listField
                    }
                }

                $(document).on('click', '.btn-filter-dynamic-coll', function() {
                    let coll = $(this).attr('_coll');
                    opts.keyword = $('.input-search-text-' + coll).val();
                    ajaxFilterDynamicImport(coll);
                });
        
                function getListItemChoiceChecked(input) {
                    let listItemID = [];
                    $(input).each((index, elem) => {
                        let name = $(elem).attr('_value');
                        let coll = $(elem).attr('_coll');
                        let type = $(elem).attr('_typeColl');
                        let ref = $(elem).attr('_ref');
                        let refFrom = $(elem).attr('_refFrom');
                        let note = $(elem).attr('_note');
                        let fieldID = $(elem).attr('id');
                        let typeVar = $(elem).attr('_type');
                        let nameCollChoice = $(elem).attr('_nameCollChoice');
                        let isRequire = $('#require-' + fieldID).is(':checked');
                        let isMapping = $('#mapping' + fieldID).is(':checked');

                        let mappingRef;
                        if (isMapping) {
                            let stringMappingRef = $(elem).attr('_mappingData');
                            mappingRef = stringMappingRef && stringMappingRef.split(',');
                        }

                        let dataEnum = [];
                        arrayDataEnum && arrayDataEnum.length && arrayDataEnum.map(item => {
                            if (item._id == fieldID) {
                                dataEnum = item.dataEnum
                            }
                        })

                        let dataDynamic = [];
                        let variableChoice = '';
                        
                        arrayValueDynamicChoice && arrayValueDynamicChoice.length && arrayValueDynamicChoice.filter(item => {
                            if (item.coll == coll) {
                                item.dataDynamic && item.dataDynamic && item.dataDynamic.map(value => {
                                    if (value.variable == name) {
                                        variableChoice = $('.field-' + coll + "-" + name + '-dynamic').val();
                                        console.log({
                                            variableChoice
                                        });
                                        dataDynamic = value.dataDynamic;
                                    }
                                })
                            }
                        })

                        let object = name;
                        if (type == 'populate') {
                            object = coll + '.' + name;
                        }

                        listItemID = [...listItemID, {
                            name,
                            coll,
                            ref,
                            refFrom,
                            note,
                            fieldID: fieldID,
                            typeVar,
                            dataEnum,
                            nameCollChoice,
                            dataDynamic,
                            variableChoice,
                            isRequire,
                            mappingRef
                        }]
                    });
        
                    return {
                        listItemID
                    }
                }

                $(document).on('click', '.btn-clear-all-field-choice-import', function() {
                    ajaxCallGetFieldImport({
                        nameColl: '${NAME_COLL}',
                        type: 'origin',
                        clear: 'clearAll'
                    });
                });

                function getInfoConditionChangeData(optionDeleteOld) {
                    let condition = {};
                    switch (optionDeleteOld) {
                        case 'YES': // CHỌN XÓA DỮ LIỆU CŨ
                            condition = {
                                ...condition,
                                delete: true,
                            }
        
                            let optionDeleteAll = $('.input-field-type-delete-all').val();
                            if (!optionDeleteAll) {
                                return { error: true, msg: 'Bạn phải xóa tất cả hay không' }
                            }
        
                            switch (optionDeleteAll) { // CHỌN XÓA TẤT CẢ DỮ LIỆU
                                case 'YES':
                                    condition = {
                                        ...condition,
                                        deleteAll: true,
                                        typeChangeData: 'insert'
                                    }
                                    break;
        
                                case 'NO':
                                    if (isEmptyObject(conditionDeleteImport)) {
                                        return { error: true, msg: 'Mời bạn chọn điều kiện xóa' }
                                    }
                                    
                                    condition = {
                                        ...condition,
                                        deleteAll: false,
                                        conditionDeleteImport
                                    }
        
                                    let typeChangData = $('.type-change-data:checked').val();
                                    if (!typeChangData) {
                                        return { error: true, msg: 'Mời bạn chọn loại thay đổi dữ liệu' }
                                    }
        
                                    if (typeChangData == 'update') {
                                        let listFieldPrimaryKey = $('.input-type-change-data-update-delete-all').val();
                                        if (!listFieldPrimaryKey || !listFieldPrimaryKey.length) 
                                            return { error: true, msg: 'Mời bạn chọn PRIMARY KEY' }
        
                                        let checkDownloadDataOld = $('.choice-download-data-old').is(':checked');

                                        condition = {
                                            ...condition,
                                            typeChangeData: 'update',
                                            listFieldPrimaryKey,
                                            checkDownloadDataOld
                                        }
                                    } else {
                                        condition = {
                                            ...condition,
                                            typeChangeData: 'insert'
                                        }
                                    }
                                    break;
                                
                                default:
                                    break;
                            }
        
                            break;
        
                        case 'NO':
                            condition = {
                                ...condition,
                                delete: false,
                            }
        
                            let typeChangData = $('.type-change-data:checked').val();
                            if (!typeChangData) {
                                return { error: true, msg: 'Mời bạn chọn loại thay đổi dữ liệu' }
                            }
        
                            if (typeChangData == 'update') {
                                let listFieldPrimaryKey = $('.input-type-change-data-update-not-delete-all').val();
        
                                if (!listFieldPrimaryKey || !listFieldPrimaryKey.length)
                                    return { error: true, msg: 'Mời bạn chọn PRIMARY KEY' }
        
                                condition = {
                                    ...condition,
                                    typeChangeData: 'update',
                                    listFieldPrimaryKey
                                }
                            } else {
                                condition = {
                                    ...condition,
                                    typeChangeData: 'insert'
                                }
                            }
                            break;
                        default:
                            break;
                    } 
        
                    return { error: false, condition }
                }
        
                $(document).on('click', '.btn-setting-excel-import', function() {
                    $('.option-choose-export').addClass('d-none');
                    let {
                        listItemID
                    } = getListItemChoiceChecked('.check-field-coll-import.checked');
                    
                    if (!listItemID || !listItemID.length) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Mời bạn chọn field IMPORT',
                            icon: 'warning'
                        });
                    }

                    let optionDeleteDataOld = $('.input-field-type-delete').val();
                    if (!optionDeleteDataOld) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: 'Bạn phải chọn có xóa dữ liệu cũ hay không',
                            icon: 'warning'
                        });
                    }

                    let condition = getInfoConditionChangeData(optionDeleteDataOld);
                    if (condition.error) {
                        return AlertCustom({
                            title: 'THÔNG BÁO',
                            message: condition.msg,
                            icon: 'warning'
                        });
                    }

                    $.ajax({
                        url: '/${NAME_COLL}/list-${NAME_COLL}-import-setting',
                        method: 'POST',
                        data: {
                            listItemImport: listItemID,
                            condition: condition.condition
                        },
                        success: resp => {
                            if (!resp.error) {
                                localStorage.setItem('list${NAME_COLL_LOWERCASE}', JSON.stringify(listItemID));
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: 'Bạn đã thêm cấu hình FILE IMPORT thành công',
                                    icon: 'success'
                                });
                            } else {
                                return AlertCustom({
                                    title: 'THÔNG BÁO',
                                    message: resp.message,
                                    icon: 'success'
                                });
                            }
                        }
                    })
                });

                $(document).on('click', '.download-excel-preview', function(e) {
                    e.preventDefault();
                    let optsParse = JSON.stringify(opts);
                    window.location.href =  '/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}-import-dowload?opts=' + optsParse;
                });

                $(document).on('click', '.type-choice-preview-ref', function() {
                    let type   = $(this).val();
                    let collID = $(this).attr('_id');
                   
                    let checked = $('.check-field-import-' + collID).is(':checked');
                    if (checked) {
                        $('.check-field-import-' + collID).trigger('click');
                    }
                });

                $(document).on('change', '.input-field-type-delete', function() {
                    let TYPE_CHOICE = $(this).val();
                    if (TYPE_CHOICE == 'YES') {
                        $('.delete-all-record-old').removeClass('d-none');
                        $('.not-delete-record-old').addClass('d-none');
                    } else if (TYPE_CHOICE == 'NO') {
                        $('.delete-all-record-old').addClass('d-none');
                        $('.not-delete-record-old').removeClass('d-none');
                        $('.type-change-data-import').removeClass('d-none');
                    } else {
                        $('.delete-all-record-old').addClass('d-none');
                        $('.not-delete-record-old').addClass('d-none');
                        $('.type-change-data-import').addClass('d-none');
                    }
                });
        
                $(document).on('change', '.input-field-type-delete-all', function() {
                    let TYPE_CHOICE = $(this).val();
                    if (TYPE_CHOICE == 'YES') {
                        $('.type-change-data-import-delete-all').removeClass('d-none');
                        $('.type-change-data-import').addClass('d-none');
                    } else if (TYPE_CHOICE == 'NO') {
                        $('.type-change-data-import-delete-all').addClass('d-none');
                        $('.type-change-data-import').removeClass('d-none');
                    } else {
                        $('.type-change-data-import-delete-all').addClass('d-none');
                        $('.type-change-data-import').addClass('d-none');
                    }
                });
        
                $(document).on('click', '.type-change-data', function() {
                    let value = $(this).val();
                    if (value == 'update') {
                        $('.input-type-change-data-update').empty();
                        let option = '';
                        respOriginImport.data && respOriginImport.data.length && respOriginImport.data.map(item => {
                            let name = item.note ? item.note : item.name;
                            let selected = '';
                            respOriginImport.listHistoryChoice && respOriginImport.listHistoryChoice.length && respOriginImport.listHistoryChoice.map(historyFieldChoice => {
                                if (historyFieldChoice.fieldID == item._id) {
                                    selected = 'selected';
                                }
                            })
                            option += '<option value="' + item.name + '" '+ selected +'>' + name + '</option>';
                        });
                        $('.input-type-change-data-update').append(option);
                        $('.input-type-change-data-update').select2({
                            dropdownParent: $('#exampleModalDefault3 .modal-content'),
                            width: '100%'
                        });
                        $('.type-change-data-update').removeClass('d-none');
                        $('.download-old-data-with-condition').removeClass('d-none');
                    } else {
                        $('.type-change-data-update').addClass('d-none');
                        $('.download-old-data-with-condition').addClass('d-none');
                    }
                });

                // ==========================SAVE IMPORT EXCEL===============================

                $(document).on('click', '.btn-save-import-excel', function() {
                    const file = $('#file__excel').prop('files')[0];
                    const fd = new FormData();
                    fd.append('file', file);

                    if (!file) {
                        return AlertCustom({ title: 'THÔNG BÁO', message: 'Mời bạn chọn FILE Import', icon: 'warning' });
                    }

                    $('.loading-file-excel').removeClass('d-none');
                    $('.file-excel-upload-import').addClass('d-none');
                    $(this).attr('disabled', true);

                    $.ajax({
                        type: "POST",
                        url: "/${NAME_COLL}/create-${NAME_COLL}-import-excel",
                        data: fd,
                        processData: false,
                        contentType: false
                    }).done(resp => {
                        if(resp.error){
                            AlertCustom({ title: 'THÔNG BÁO', message: resp.message, icon: 'error' });
                        } else{
                            AlertCustom({ title: 'THÔNG BÁO', message: 'Bạn đã thêm thành công', icon: 'success' });
                            setTimeout(location.reload(), 700);
                        }

                        $('.loading-file-excel').addClass('d-none');
                        $('.file-excel-upload-import').removeClass('d-none');
                        $(this).attr('disabled', false);

                    }).fail(err => AlertCustom({ title: 'THÔNG BÁO', message: err.message, icon: 'error' }))
                    
                });
                
                function getListFieldOfRef(ref) {
                    const fieldsChoosed = $('.input-field-choosed-insert-update-from-'+ ref).val();
                   
                    $.ajax({
                        type: "GET",
                        url: "/list-field-by-coll?name="+ ref,
                    }).done(resp => {
                        const { listFields } = resp;
                       
                        if(listFields.length){
                            let htmlListFields = '';
                            let listFieldsChoosed = fieldsChoosed ? fieldsChoosed.split(',') : [];
        
                            listFields.map((field, index) => {
                                let isCheck = listFieldsChoosed.includes(field.name);
                                let checked = '';
                                if (isCheck) {
                                    checked = 'checked';
                                }
                                htmlListFields += '<li class="list-group-item "><div class="checkbox checkbox-success form-check-inline"><input '+ checked +' class="input-field-mapping-' + ref + '" type="checkbox" id="cbField' + index + '" value="' + field.name + '"><label class="label-export" for="cbField' + index + '"> ' + field.name + ' </label></div></li>';
                            });
        
                            $('.modal-get-field-from-coll .container-list-field-collection .list-group').html(htmlListFields);
                            $('.modal-get-field-from-coll').attr('__tid', tid);
                            $('.modal-get-field-from-coll').modal('show');
                        } else{
                            SwalMixin('Không tìm thấy collection này', 'error');
                        }
        
                    }).fail(err => SwalMixin(err.message, 'error'))
                }
        
                // ÁNH XẠ DỮ LIỆU IMPORT
                $(document).on('click', '.mapping-data-populate', function() {
                    let mappingChecked = $(this).is(':checked');
                    let ref            = $(this).attr('_ref');
        
                    if (mappingChecked) {
                        $('.modal-get-field-from-coll').attr('_ref', ref);
                        getListFieldOfRef(ref);
                        $('.modal-get-field-from-coll').modal('show');
                    } 
                })
        
                $('.modal-get-field-from-coll').on('hidden.bs.modal', function () {
                    const ref 			= $('.modal-get-field-from-coll').attr('_ref');
                    let arrayMappingRef = [];
        
                    $('.input-field-mapping-' + ref).each((i, elem) => {
                        let checked = $(elem).is(':checked');
                        if (checked) {
                            let value = $(elem).val();
                            arrayMappingRef = [
                                ...arrayMappingRef,
                                value
                            ];
                        }
                    });
                    
                    $('.ref-import-'+ ref).attr('_mappingData', arrayMappingRef.join(','));
                
                });

                ${functionUpdateStatus}
            })
        </script>
    `;

    return outputtedFile;
}

exports.createContentScriptAddView = async (fields, fieldsExcept, collectionName, collectionDescription) => {
	const NAME_COLL_LOWERCASE 		= collectionName.toLowerCase();
    const NAME_COLL_UPPERCASE 		= collectionName.toUpperCase();

    let outputTinyMCE               = '';
    let outputCurrency              = '';
    let outputEnum                  = '';
    let outputInitLibrary           = '';
    let outputFieldInsert           = '';
    let outputSelectorInsert        = '';
    let outputInitSingleUploadFile  = '';
    let outputSelectorUploadFile    = '';

    let outputValidateFieldExist    = '';
    let outputValidateFieldEnum     = '';
    let outputValidateFieldPhone    = '';
    let outputValidateFieldEmail    = '';
    let outputValidateEventScript   = '';

    let outputScriptFollowBy        = '';

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    fields.map(field => {
        const input                 = field.input;
        const INPUT_NAME            = input.name;
        const INPUT_NAME_LOWERCASE  = input.name.toLowerCase();
        const INPUT_ID              = `${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}`;
        const fieldName             = input.note.toLowerCase() || input.name.toLowerCase();

        if(check.isTrue(input.isInsert) && !listFieldsExcept.includes(INPUT_NAME)){

            if(!check.isTrue(input.isImage)){
                outputFieldInsert += `${INPUT_NAME}, `;
            }

            switch (input.type) {
                case 'text':
                    if(check.isTrue(input.isTinyMCE)){
                        // Init selector
                        outputSelectorInsert += 
                            `let ${INPUT_NAME} = tinyMCE.get("${INPUT_ID}").getContent();
                        `;

                        // Init library
                        outputTinyMCE += `initEditor("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}");\n`;
                    } else{
                        if (!check.isTrue(input.isApiAddress)) {
                            // Init library
                            outputInitLibrary += `initInputMaxLength('#${INPUT_ID}');`;
                            // Init selector
                            outputSelectorInsert += `
                                let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                            `;
                        } else {
                            if (input.isShowSelect == 'show') {
                                outputSelectorInsert += `
                                    let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                                `;
                            } else {
                                outputSelectorInsert += `
                                    let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${input.inputCode.toLowerCase()} option:selected').text();
                                `;
                            }
                        }
                        
                    }
                    
                    break;
                case 'number':
                    if(check.isTrue(input.isEnum)){
                        // Init selector
                        outputSelectorInsert += 
                            `let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                        `;
                    }

                    if(check.isTrue(input.isCurrency)){
                        // Init selector
                        outputSelectorInsert += 
                            `let ${INPUT_NAME} = ${INPUT_NAME}Cleave.getRawValue();
                        `;

                        // Init library
                        outputCurrency += `let ${INPUT_NAME}Cleave = initOneCleave("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}");\n`;
                    }

                    if(!check.isTrue(input.isEnum) && !check.isTrue(input.isCurrency)){
                        // Init selector
                        outputSelectorInsert += `
                            let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                        `;
                    }

                    break;
                case 'boolean':
                case 'date':
                    outputSelectorInsert +=
                        `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                    `;
                    break;
                case 'object':
                    if(check.isTrue(input.isImage)){
                        outputInitSingleUploadFile += `initDropify('#${INPUT_ID}');`;
                        outputSelectorUploadFile += `
                            let ${INPUT_NAME}InputFiles = $("#${INPUT_ID}").prop('files');

                            if(${INPUT_NAME}InputFiles && ${INPUT_NAME}InputFiles.length){
                                const links = await getLinksUpload(${INPUT_NAME}InputFiles);
    
                                dataInsert.${INPUT_NAME} = {
                                    name: links[0].fileName,
                                    path: links[0].uri,
                                    type: links[0].type,
                                    size: ${INPUT_NAME}InputFiles[0].size,
                                }
                            }
                        `;
                    } else{
                        // Init selector
                        outputSelectorInsert += `
                            let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                        `;
                    }

                    break;
                case 'array':
                    if(input.ref){

                        if(!check.isTrue(input.isImage)){
                            if(input.tableSub){
                                outputSelectorInsert += `
                                    let cb${input.ref.toCapitalize()} = $('input[type="radio"][name="rdOptions${input.ref.toCapitalize()}"]:checked').val();
                                    let ${INPUT_NAME} = [];

                                    if(cb${input.ref.toCapitalize()} === 'specify'){
                                        ${INPUT_NAME} = [...${input.ref}Selected];
                                    } else{
                                        ${INPUT_NAME} = ['all'];
                                    }
                                `;
                            } else{
                                outputSelectorInsert += 
                                    `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                                `;
                            }
                        }

                    } else{
                        outputSelectorInsert += 
                            `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                        `;
                    }
                    break;
                default:
                    break;
            }

            /**
             * Meet 3 conditions:
             * - Is enum
             * - Is ref and not image
             * - Is not table sub
             * - Is not big data
             */
            if(check.isTrue(input.isEnum) || (input.ref && !check.isTrue(input.isImage)) && !input.tableSub && !check.isTrue(input.isBigData)){
                outputEnum += `
                    $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                `;
            }

            if(check.isTrue(input.isBigData) && input.ref && !check.isTrue(input.isImage)){
                outputEnum += `
                    $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({
                        minimumInputLength: 3,
                        ajax: {
                            url: '/api/${input.ref.toLowerCase()}/list-${input.ref.toLowerCase()}s',
                            type: 'GET',
                            dataType: 'json',
                            delay: 1000,
                            // cache: true,
                            data: params => ({ search: params.term, page: params.page || 1 }),
                            processResults: (data, params) => ({
                                results: $.map(data.data?.records, item => ({
                                    text: item.${input.refShow},
                                    id: item._id
                                })),
                                pagination: {
                                    more: true
                                }
                            })
                        }
                    });
                `;
            }

            if (check.isTrue(input.isApiAddress) && input.isShowSelect == 'show') { // CALL API ĐỊA CHỈ
                if (input.fieldChild) { // CTTY && DISTRICT

                    if (input.name == 'city') {
                        outputEnum += `
                            function loadListCity() {
                                $.ajax({
                                    url: '/list-provinces',
                                    method: 'GET',
                                    success: resp => {
                                        if (!resp.error) {
                                            let option = '<option value="" >Chọn Tỉnh/Thành phố</option>';
                                            resp.data && resp.data.length && resp.data.map(item => {
                                                option += '<option value="'+ item[1].code +'" >'+ item[1].name_with_type +'</option>';
                                            });
                                            $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').append(option);
                                        } 
                                    }
                                });
                            }

                            loadListCity();
                        `;
                    }

                    if (input.name == 'district') {
                        outputEnum += `$("#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}").select2({ width:"100%" });`
                    }

                    outputEnum += `
                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                        $(document).on('change', '#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}', function() {
                            let value = $(this).val();
                            if (value) {
                                $.ajax({
                                    url: '/list-${input.fieldChild.toLowerCase()}s/' + value,
                                    method: 'GET',
                                    success: resp => {
                                        if (!resp.error) {
                                            let respAfterChange = Object.entries(resp.data);
                                            let option = '<option value="" selected>${ input.placeholder }</option>';
                                            respAfterChange && respAfterChange.length && respAfterChange.map(item => {
                                                option += '<option value="'+ item[1].code +'" >'+ item[1].name_with_type +'</option>';
                                            });
                                            $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').empty();
                                            $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').append(option);
                                            if (value) {
                                                $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').trigger('change');
                                            }
                                        } 
                                    }
                                });
                            } else {
                                $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').empty();
                            }
                        });
                    `;
                }
                
            }

            // Init validation
            if(check.isTrue(input.isRequire) && !check.isTrue(input.isImage)){

                if(input.type === 'array' || input.type === 'object'){
                    if(input.type === 'array'){
                        outputValidateFieldExist += `
                            if(!${INPUT_NAME}.length){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }
    
                    if(input.type === 'object'){
                        let checkObj = INPUT_NAME;

                        if(!input.ref){
                            checkObj = `isEmptyObj(${INPUT_NAME})`;
                        }

                        outputValidateFieldExist += `
                            if(!${checkObj}){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;  
                    }

                } else{

                    if(input.type === 'text'){
                        if (!check.isTrue(input.isApiAddress) || (check.isTrue(input.isApiAddress) && input.isShowSelect == 'show')) {
                            outputValidateFieldExist += `
                                if(!${INPUT_NAME}.trim()){
                                    fieldsError = [...fieldsError, '${INPUT_ID}'];
                                    enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                                } else{
                                    if(!fieldsError.includes('${INPUT_ID}')){
                                        disableValidate('#${INPUT_ID}');
                                    }
                                }
                            `;
                        }
                    } else{
                        outputValidateFieldExist += `
                            if(!${INPUT_NAME}){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }

                    if(check.isTrue(input.isEnum)){

                        switch (input.type) {
                            case 'text':
                                outputValidateFieldEnum += `
                                    if(![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
                                break;
                            case 'number':
                                outputValidateFieldEnum += `
                                    if(!checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${INPUT_NAME} })){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
                                break;
                            default:
                                break;
                        }

                        outputValidateEventScript += `
                            $('#${INPUT_ID}').on('change', function () {
                                const value = $(this).val();
                                if (!value) {
                                    enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                                } else {
                                    disableValidate('#${INPUT_ID}');
                                }
                            });
                        `;
                    } else{

                        switch (input.name) {
                            case 'phone': {
                                outputValidateFieldPhone = `
                                    if(!validPhoneNumber(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "Số điện thoại không đúng định dạng");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
        
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập số điện thoại");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                            }
                            case 'email': {
                                outputValidateFieldEmail = `
                                    if(!validEmail(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "Email không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
        
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập địa chỉ email");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                            }
                            default:
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                        }
                        // END SWITCH

                    }
                    // END ELSE

                }

            } else{

                if(check.isTrue(input.isEnum)){
                    if(input.type === 'text'){
                        outputValidateFieldEnum += `
                            if(${INPUT_NAME} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${INPUT_NAME})){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }

                    if(input.type === 'number'){
                        outputValidateFieldEnum += `
                            if(${INPUT_NAME} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${INPUT_NAME} })){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }
                }

                if(input.name === 'phone'){
                    outputValidateFieldPhone = `
                        if(${INPUT_NAME} && !validPhoneNumber(${INPUT_NAME})){
                            fieldsError = [...fieldsError, '${INPUT_ID}'];
                            enableValidate('#${INPUT_ID}', "Số điện thoại không đúng định dạng");
                        } else{
                            if(!fieldsError.includes('${INPUT_ID}')){
                                disableValidate('#${INPUT_ID}');
                            }
                        }
                    `;
                }

                if(input.name === 'email'){
                    outputValidateFieldEmail = `
                        if(${INPUT_NAME} && !validEmail(${INPUT_NAME})){
                            fieldsError = [...fieldsError, '${INPUT_ID}'];
                            enableValidate('#${INPUT_ID}', "Email không hợp lệ");
                        } else{
                            if(!fieldsError.includes('${INPUT_ID}')){
                                disableValidate('#${INPUT_ID}');
                            }
                        }
                    `;
                }

            }

            // Dạng select change theo giá trị chỉ định
            if(input.followBy){
                let ID_FOLLOW = `${NAME_COLL_LOWERCASE}__${input.followBy.toLowerCase()}`;
                let ID_FIELD  = `${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}`;

                outputScriptFollowBy += `
                    $('#${ID_FOLLOW}').on('change', function () {
                        const value = $(this).val();

                        $.ajax({
                            type: "GET",
                            url: "/${NAME_COLL_LOWERCASE}/list-${input.name.toLowerCase()}-by-parent?${input.followBy}=" + value,
                        }).done(resp => {
                            $('#${ID_FIELD}').empty();
                            if(resp && resp.length){
                                resp.map(item => {
                                    let newOption = new Option(item.name, item._id, false, false);
                                    $('#${ID_FIELD}').append(newOption).trigger('change');
                                })
                            }
                        }).fail(err => AlertCustom({ title: 'THÔNG BÁO', message: err.message, icon: 'error' }))
                    });
                `;
            }

        }
    });

    let { htmlInsertUpload } = renderMultipleUploadScript(fields);

    let outputtedFile = `
        <script>
            $(document).ready(function(){
                ${outputCurrency}
                ${outputEnum}
                ${outputTinyMCE}
                ${outputInitLibrary}
                ${outputInitSingleUploadFile}
                ${htmlInsertUpload.htmlScriptInitUploadInsert}
                ${outputValidateEventScript}
                ${outputScriptFollowBy}
                ${await renderScriptTableSub(fields, collectionName, 'INSERT')}
                const getFormInsert = () => {
                    ${outputSelectorInsert}
                    return { ${outputFieldInsert} };
                }

                const checkFormValid = params => {
                    let { ${outputFieldInsert} } = params;
                    let fieldsError = [];
                    ${outputValidateFieldEnum}
                    ${outputValidateFieldEmail}
                    ${outputValidateFieldPhone}
                    ${outputValidateFieldExist}
                    if(fieldsError.length){
                        return { error: true, msg: 'Form nhập không hợp lệ' };
                    }

                    return { error: false };
                }

                const callAjaxInsert = dataInsert => {
                    $.ajax({
                        url: "<%= CF_ROUTINGS_${NAME_COLL_UPPERCASE}.ADD_${NAME_COLL_UPPERCASE} %>",
                        method: 'POST',
                        data: dataInsert,
                    }).done(resp => {
                        const { error, message } = resp;

                        if(error){
                            return AlertCustom({
                                title: 'THÔNG BÁO',
                                message: message,
                                icon: 'warning'
                            });
                        }

                        AlertCustom({ title: 'THÔNG BÁO', message: 'Thêm ${collectionDescription || NAME_COLL_LOWERCASE} thành công', icon: 'info' });
                        setTimeout(() => location.reload(), 800);
                    })
                    .fail(err => AlertCustom({ title: 'THÔNG BÁO', message: err.message, icon: 'error' }))
                    .always(() => disableButtonLoading('#btnConfirmAdd'))
                }

                $('#btnConfirmAdd').on('click', async function () {
                    let dataInsert = getFormInsert();
                    let { error, msg } = checkFormValid(dataInsert);
                    if(error) return AlertCustom({ title: 'THÔNG BÁO', message: msg, icon: 'warning' });

                    enableButtonLoading(this);
                    ${htmlInsertUpload.htmlScriptGetUploadInsert}
                    ${outputSelectorUploadFile}
                    callAjaxInsert(dataInsert);
                });
            })
        </script>
    `;

    return outputtedFile;
}

exports.createContentScriptUpdateView = async (fields, fieldsExcept, collectionName, collectionDescription) => {
	const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_UPPERCASE 	= collectionName.toUpperCase();
    const NAME_COLL_CAPITALIZE 	= collectionName.toCapitalize();

    let outputTinyMCE               = '';
    let outputCurrency              = '';
    let outputEnum                  = '';
    let outputInitLibrary           = '';
    let outputFieldUpdate           = '';
    let outputSelectorUpdate        = '';
    let outputInitSingleUploadFile  = '';
    let outputSelectorUploadFile    = '';
    let outputIsApiAddress          = '';

    let outputValidateFieldExist    = '';
    let outputValidateFieldEnum     = '';
    let outputValidateFieldPhone    = '';
    let outputValidateFieldEmail    = '';
    let outputValidateEventScript   = '';

    let outputScriptFollowBy        = '';

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    fields.map(field => {
        const input                 = field.input;
        const INPUT_NAME            = input.name;
        const INPUT_NAME_LOWERCASE  = input.name.toLowerCase();
        const INPUT_ID              = `${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}`;
        const fieldName             = input.note.toLowerCase() || input.name.toLowerCase();

        if(check.isTrue(input.isUpdate) && !listFieldsExcept.includes(INPUT_NAME)) {

            if(!check.isTrue(input.isImage)){
                outputFieldUpdate += `${INPUT_NAME}, `;
            }

            switch (input.type) {
                case 'text':
                    if(check.isTrue(input.isTinyMCE)){
                        // Init selector
                        outputSelectorUpdate += 
                            `let ${INPUT_NAME} = tinyMCE.get("${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").getContent();
                        `;

                        // Init library
                        outputTinyMCE += `initEditor("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}");\n`;
                    } else{
                        if (!check.isTrue(input.isApiAddress)) {
                            outputSelectorUpdate += 
                                `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                            `;

                            if(!check.isTrue(input.isEnum)) {
                                outputInitLibrary += `initInputMaxLength('#${INPUT_ID}');`;
                            }
                        } else {
                            if (input.isShowSelect == 'show') {
                                outputSelectorUpdate += `
                                    let ${INPUT_NAME} = $('#${INPUT_ID}').val();
                                `;
                            } else {
                                outputSelectorUpdate += `
                                    let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${input.inputCode.toLowerCase()} option:selected').text();
                                `;
                            }
                        }

                        if(check.isTrue(input.isEnum)){
                            outputEnum += `
                                $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                                $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").val("<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>").trigger('change');
                            `;
                        }
                    }
                    break;
                case 'number':
                    if(check.isTrue(input.isCurrency)){
                         // Init selector
                        outputSelectorUpdate += 
                            `let ${INPUT_NAME} = ${INPUT_NAME}Cleave.getRawValue();
                        `;
                        // Init library
                        outputCurrency += `let ${INPUT_NAME}Cleave = initOneCleave("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}");\n`;
                    }

                    if(check.isTrue(input.isEnum)){
                        outputEnum += `
                            $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                            $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").val("<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>").trigger('change');
                        `;
                         // Init selector
                        outputSelectorUpdate += 
                            `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                        `;
                    }

                    if(!check.isTrue(input.isCurrency) && !check.isTrue(input.isEnum)){
                        // Init selector
                        outputSelectorUpdate += `
                            let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                        `;
                    }

                    break;
                case 'boolean':
                case 'date':
                    outputSelectorUpdate +=
                        `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                    `;
                    break;
                case 'object':
                    if(check.isTrue(input.isImage)){
                        outputInitSingleUploadFile += `initDropify('#${INPUT_ID}');`;
                        outputSelectorUploadFile += `
                            let ${INPUT_NAME}InputFiles = $("#${INPUT_ID}").prop('files');
    
                            if(${INPUT_NAME}InputFiles && ${INPUT_NAME}InputFiles.length){
                                const links = await getLinksUpload(${INPUT_NAME}InputFiles);
    
                                dataUpdate.${INPUT_NAME} = {
                                    name: links[0].fileName,
                                    path: links[0].uri,
                                    type: links[0].type,
                                    size: ${INPUT_NAME}InputFiles[0].size,
                                }
                            }
                        `;
                    } else{
                        // Init selector
                        outputSelectorUpdate += 
                            `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                        `;
                    }

                    if(input.ref && !check.isTrue(input.isImage)){
                        
                        if(check.isTrue(input.isBigData)){
                            outputEnum += `
                                $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({
                                    minimumInputLength: 3,
                                    ajax: {
                                        url: '/api/${input.ref.toLowerCase()}/list-${input.ref.toLowerCase()}s',
                                        type: 'GET',
                                        dataType: 'json',
                                        delay: 1000,
                                        // cache: true,
                                        data: params => ({ search: params.term, page: params.page || 1 }),
                                        processResults: (data, params) => ({
                                            results: $.map(data.data?.records, item => ({
                                                text: item.${input.refShow},
                                                id: item._id
                                            })),
                                            pagination: {
                                                more: true
                                            }
                                        })
                                    }
                                });
                            `;
                        } else{
                            outputEnum += `
                                $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                                $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").val("<%= info${NAME_COLL_CAPITALIZE}.${input.name} && info${NAME_COLL_CAPITALIZE}.${input.name}._id %>").trigger('change');
                            `;
                        }

                    }
                    break;
                case 'array':
                    if(!check.isTrue(input.isImage)){
                        if(input.ref){
                            const fieldName = `info${NAME_COLL_CAPITALIZE}.${input.name}`;
                            const getValues = "`<%= " + fieldName + " && " + fieldName + ".map(item => item._id) %>`.split(',');"

                            if(input.tableSub){
                                outputSelectorUpdate += `
                                    let cb${input.ref.toCapitalize()} = $('input[type="radio"][name="rdOptions${input.ref.toCapitalize()}"]:checked').val();
                                    let ${INPUT_NAME} = [];

                                    if(cb${input.ref.toCapitalize()} === 'specify'){
                                        ${INPUT_NAME} = [...${input.ref}Selected];
                                    } else{
                                        ${INPUT_NAME} = ['all'];
                                    }
                                `;
                            } else{

                                if(check.isTrue(input.isBigData)){
                                    outputEnum += `
                                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({
                                            minimumInputLength: 3,
                                            ajax: {
                                                url: '/api/${input.ref.toLowerCase()}/list-${input.ref.toLowerCase()}s',
                                                type: 'GET',
                                                dataType: 'json',
                                                delay: 1000,
                                                // cache: true,
                                                data: params => ({ search: params.term, page: params.page || 1 }),
                                                processResults: (data, params) => ({
                                                    results: $.map(data.data?.records, item => ({
                                                        text: item.${input.refShow},
                                                        id: item._id
                                                    })),
                                                    pagination: {
                                                        more: true
                                                    }
                                                })
                                            }
                                        });

                                        const list${input.name.toCapitalize()} = ${getValues}
                                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").val(list${input.name.toCapitalize()}).trigger('change');
                                    `;
                                } else{
                                    outputEnum += `
                                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                                        const list${input.name.toCapitalize()} = ${getValues}
                                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").val(list${input.name.toCapitalize()}).trigger('change');
                                    `;
                                }

                                outputSelectorUpdate += 
                                    `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                                `;
                            }
                        } else{
                            // Init selector
                            outputSelectorUpdate += 
                                `let ${INPUT_NAME} = $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').val();
                            `;
                        }
                    }
                    break;
                default:
                    break;
            }

            // Init validation
            if(check.isTrue(input.isRequire) && !check.isTrue(input.isImage)){

                if(input.type === 'array' || input.type === 'object'){
                    if(input.type === 'array'){
                        outputValidateFieldExist += `
                            if(!${INPUT_NAME}.length){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }
    
                    if(input.type === 'object'){
                        let checkObj = INPUT_NAME;

                        if(!input.ref){
                            checkObj = `isEmptyObj(${INPUT_NAME})`;
                        }

                        outputValidateFieldExist += `
                            if(!${checkObj}){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;   
                    }

                } else{
                    if(input.type === 'text'){
                        if (!check.isTrue(input.isApiAddress) || (check.isTrue(input.isApiAddress) && input.isShowSelect == 'show')) {
                            outputValidateFieldExist += `
                                if(!${INPUT_NAME}.trim()){
                                    fieldsError = [...fieldsError, '${INPUT_ID}'];
                                    enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                                } else{
                                    if(!fieldsError.includes('${INPUT_ID}')){
                                        disableValidate('#${INPUT_ID}');
                                    }
                                }
                            `;
                        }
                    } else{
                        outputValidateFieldExist += `
                            if(!${INPUT_NAME}){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }

                    if(check.isTrue(input.isEnum)){
                        switch (input.type) {
                            case 'text':
                                outputValidateFieldEnum += `
                                    if(![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
                                break;
                            case 'number':
                                outputValidateFieldEnum += `
                                    if(!checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${INPUT_NAME} })){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
                                break;
                            default:
                                break;
                        }

                        outputValidateEventScript += `
                            $('#${INPUT_ID}').on('change', function () {
                                const value = $(this).val();
                                if (!value) {
                                    enableValidate('#${INPUT_ID}', "Vui lòng chọn ${fieldName}");
                                } else {
                                    disableValidate('#${INPUT_ID}');
                                }
                            });
                        `;
                    } else{

                        switch (input.name) {
                            case 'phone': {
                                outputValidateFieldPhone = `
                                    if(!validPhoneNumber(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "Số điện thoại không đúng định dạng");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
        
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập số điện thoại");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                            }
                            case 'email': {
                                outputValidateFieldEmail = `
                                    if(!validEmail(${INPUT_NAME})){
                                        fieldsError = [...fieldsError, '${INPUT_ID}'];
                                        enableValidate('#${INPUT_ID}', "Email không hợp lệ");
                                    } else{
                                        if(!fieldsError.includes('${INPUT_ID}')){
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    }
                                `;
        
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập địa chỉ email");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                            }
                            default:{
                                outputValidateEventScript += `
                                    $('#${INPUT_ID}').on('input', function () {
                                        const value = $(this).val();
                                        if (!value) {
                                            enableValidate('#${INPUT_ID}', "Vui lòng nhập ${fieldName}");
                                        } else {
                                            disableValidate('#${INPUT_ID}');
                                        }
                                    });
                                `;
                                break;
                            }
                        }
                        // END SWITCH
                    }
                    // END ELSE
                }

            } else{

                if(check.isTrue(input.isEnum)){
                    if(input.type === 'text'){
                        outputValidateFieldEnum += `
                            if(${INPUT_NAME} && ![${input.dataEnum.map(item => `"${item.value}"`)}].includes(${INPUT_NAME})){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }
    
                    if(input.type === 'number'){
                        outputValidateFieldEnum += `
                            if(${INPUT_NAME} && !checkNumberIsValidWithRange({ arrValid: [${input.dataEnum.map(item => +item.value)}], val: ${INPUT_NAME} })){
                                fieldsError = [...fieldsError, '${INPUT_ID}'];
                                enableValidate('#${INPUT_ID}', "${fieldName} không hợp lệ");
                            } else{
                                if(!fieldsError.includes('${INPUT_ID}')){
                                    disableValidate('#${INPUT_ID}');
                                }
                            }
                        `;
                    }
                }

                if(input.name === 'phone'){
                    outputValidateFieldPhone = `
                        if(${INPUT_NAME} && !validPhoneNumber(${INPUT_NAME})){
                            fieldsError = [...fieldsError, '${INPUT_ID}'];
                            enableValidate('#${INPUT_ID}', "Số điện thoại không đúng định dạng");
                        } else{
                            if(!fieldsError.includes('${INPUT_ID}')){
                                disableValidate('#${INPUT_ID}');
                            }
                        }
                    `;
                }

                if(input.name === 'email'){
                    outputValidateFieldEmail = `
                        if(${INPUT_NAME} && !validEmail(${INPUT_NAME})){
                            fieldsError = [...fieldsError, '${INPUT_ID}'];
                            enableValidate('#${INPUT_ID}', "Email không hợp lệ");
                        } else{
                            if(!fieldsError.includes('${INPUT_ID}')){
                                disableValidate('#${INPUT_ID}');
                            }
                        }
                    `;
                }

            }

            if (check.isTrue(input.isApiAddress) && input.isShowSelect == 'show') { // CALL API ĐỊA CHỈ
                if (input.fieldChild) { // CTTY && DISTRICT
                    if (input.name == 'city') {
                        outputIsApiAddress += `
                            let city = '<%= info${NAME_COLL_CAPITALIZE}.city %>';
                            function loadListCity() {
                                $.ajax({
                                    url: '/list-provinces',
                                    method: 'GET',
                                    success: resp => {
                                        if (!resp.error) {
                                            let option = '<option value="" >Chọn Tỉnh/Thành phố</option>';
                                            resp.data && resp.data.length && resp.data.map(item => {
                                                let selected = '';
                                                if (city == item[1].code) {
                                                    selected = 'selected';
                                                }
                                                option += '<option value="'+ item[1].code +'" '+ selected +'>'+ item[1].name_with_type +'</option>';
                                            });
                                            $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').append(option);
                                            $('#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}').trigger('change');
                                        } 
                                    }
                                });
                            }

                            loadListCity();
                        `;
                    }

                    if (input.name == 'district') {
                        outputIsApiAddress += `$("#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}").select2({ width:"100%" });`
                    }

                    outputIsApiAddress += `
                        $("#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}").select2({ width:"100%" });
                        let ${input.fieldChild.toLowerCase()} = '<%= info${NAME_COLL_CAPITALIZE}.${input.fieldChild.toLowerCase()} %>';

                        $(document).on('change', '#${NAME_COLL_LOWERCASE}__${INPUT_NAME_LOWERCASE}', function() {
                            let value = $(this).val();
                            if (value) {
                                $.ajax({
                                    url: '/list-${input.fieldChild.toLowerCase()}s/' + value,
                                    method: 'GET',
                                    success: resp => {
                                        if (!resp.error) {
                                            let respAfterChange = Object.entries(resp.data);
                                            let option = '<option value="" selected>${ input.placeholder }</option>';
                                            respAfterChange && respAfterChange.length && respAfterChange.map(item => {
                                                let selected = '';
                                                if (${input.fieldChild.toLowerCase()} == item[1].code) {
                                                    selected = 'selected';
                                                }
                                                option += '<option value="'+ item[1].code +'" '+ selected +'>'+ item[1].name_with_type +'</option>';
                                            });
                                            $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').empty();
                                            $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').append(option);
                                            $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').trigger('change');
                                        } 
                                    }
                                });
                            } else {
                                $('#${NAME_COLL_LOWERCASE}__${input.fieldChild.toLowerCase()}').empty();
                            }
                        });
                    `;
                }
            }

            if(input.followBy){
                let ID_FOLLOW = `${NAME_COLL_LOWERCASE}__${input.followBy.toLowerCase()}`;
                let ID_FIELD  = `${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}`;

                outputScriptFollowBy += `
                    $('#${ID_FOLLOW}').on('change', function () {
                        const value = $(this).val();

                        $.ajax({
                            type: "GET",
                            url: "/${NAME_COLL_LOWERCASE}/list-${input.name.toLowerCase()}-by-parent?${input.followBy}=" + value,
                        }).done(resp => {
                            $('#${ID_FIELD}').empty();
                            if(resp && resp.length){
                                resp.map(item => {
                                    let newOption = new Option(item.name, item._id, false, false);
                                    $('#${ID_FIELD}').append(newOption).trigger('change');
                                })
                            }
                        }).fail(err => AlertCustom({ title: 'THÔNG BÁO', message: err.message, icon: 'error' }))
                    });
                `;
            }

        }
    });

    let { htmlUpdateUpload } = renderMultipleUploadScript(fields);

    let outputtedFile = `
        <script>
            $(document).ready(function(){
                ${outputEnum}
                ${outputTinyMCE}
                ${outputCurrency}
                ${outputInitLibrary}
                ${outputInitSingleUploadFile}
                ${htmlUpdateUpload.htmlScriptInitUploadUpdate}
                ${outputValidateEventScript}
                ${outputScriptFollowBy}
                ${outputIsApiAddress}
                window.onbeforeunload = function() {
                    return "";
                };

                $(document).on('change input', '.form-control, .form-select, input', function() {
                    $('#btnConfirmUpdate').attr('disabled', false);
                });

                ${await renderScriptTableSub(fields, collectionName, 'UPDATE')}

                const getFormUpdate = () => {
                    ${outputSelectorUpdate}
                    return { ${outputFieldUpdate} };
                }

                const checkFormValid = params => {
                    let { ${outputFieldUpdate} } = params;
                    let fieldsError = [];
                    ${outputValidateFieldEnum}
                    ${outputValidateFieldEmail}
                    ${outputValidateFieldPhone}
                    ${outputValidateFieldExist}
                    if(fieldsError.length){
                        return { error: true, msg: 'Form nhập không hợp lệ' };
                    }

                    return { error: false };
                }

                const callAjaxUpdate = dataUpdate => {
                    $.ajax({
                        url: "<%= CF_ROUTINGS_${NAME_COLL_UPPERCASE}.UPDATE_${NAME_COLL_UPPERCASE}_BY_ID %>",
                        method: 'PUT',
                        data: dataUpdate,
                    }).done(resp => {
                        const { error, message } = resp;

                        if(error){
                            return AlertCustom({ title: 'THÔNG BÁO', message: message, icon: 'warning' });
                        }

                        AlertCustom({ title: 'THÔNG BÁO', message: "Cập nhật ${collectionDescription || NAME_COLL_LOWERCASE} thành công", icon: 'info' });
                    })
                    .fail(err => AlertCustom({ title: 'THÔNG BÁO', message: err.message, icon: 'error' }))
                    .always(() => {
                        disableButtonLoading('#btnConfirmUpdate');
                        $('#btnConfirmUpdate').attr('disabled', true);
                    })
                }

                ${false ? (`$("${outputSelectorUploadFile[0].selector}").on('change', readURLPreview);`) : ''}

                $('#btnConfirmUpdate').on('click', async function () {
                    let dataUpdate = getFormUpdate();
                    let { error, msg } = checkFormValid(dataUpdate);
                    if(error) return AlertCustom({ title: 'THÔNG BÁO', message: msg, icon: 'warning' });

                    enableButtonLoading(this);
                    dataUpdate.${NAME_COLL_LOWERCASE}ID = $(this).attr('__${NAME_COLL_LOWERCASE}ID');

                    ${htmlUpdateUpload.htmlScriptGetUploadUpdate}
                    ${outputSelectorUploadFile}
                    callAjaxUpdate(dataUpdate);
                });
            })
        </script>
    `;

    return outputtedFile;
}

exports.createContentScriptCommon = require('./utils/generate_script_common').createContentScriptCommon;
