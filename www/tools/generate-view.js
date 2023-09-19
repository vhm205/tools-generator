const check             = require('./module/check');
const tool              = require('./module/tool');
const beautifyerHTML    = require('js-beautify').html_beautify;
const fs                = require('fs');
const chalk             = require('chalk');
const logger			= require('../config/logger/winston.config');
const log               = console.log;

const MANAGE__COLL_COLL = require('../database/manage_coll-coll');
const TYPE__COLL_COLL   = require('../database/type_coll-coll');

const {
    createContentScriptListView,
    createContentScriptAddView,
    createContentScriptUpdateView,
    createContentScriptCommon
} = require('./generate-script');


async function renderModalSelectTableSub(input, typePage) {
    const FIELD_REF_CAPITALIZE  = input.ref.toCapitalize();
    let outputColumnFieldsRef   = '';
    let fieldsRef               = [];

    const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() });
    if(coll){
        const listFields = await TYPE__COLL_COLL.find({ coll: coll._id }).lean();

        if(listFields && listFields.length){
            fieldsRef = [...listFields];

            for (const input of listFields) {
                if(input.isShowList && !input.isOrder){
                    outputColumnFieldsRef += `<th class="text-left">${input.note || input.name}</th>`;
                } 
            }
        }

    }

    return `
        <div class="modal fade bd-example-modal-xl" id="modalFilter${FIELD_REF_CAPITALIZE}" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title">Chọn ${input.note || input.name}</h6>
                    </div>
                    <div class="card-body">

                        <div class="row mb-3">
                            <div class="col-12 col-sm-4 d-flex justify-content-start">
                                <div class="input-group">
                                    <label class="my-2 me-2">Tìm kiếm</label>
                                    <input type="text" class="form-control input-search-select" autocomplete="off" placeholder="Search...">
                                    <button class="input-group-text btn-search-select">
                                        <i class="ti-search"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12 col-sm-2">
                                <button class="btn btn-secondary" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCondition${FIELD_REF_CAPITALIZE}" aria-controls="offcanvasCondition${FIELD_REF_CAPITALIZE}">
                                    <i class="fas fa-filter"></i> Bộ lọc
                                </button>
                                <button class="btn btn-danger btn-reset-filter">
                                    <i class="fas fa-redo"></i> Reset
                                </button>

                                ${await renderFilter(fieldsRef, `offcanvasCondition${FIELD_REF_CAPITALIZE}`)}
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <div class="d-flex justify-content-between">
                                            <h5 class="card-title">
                                                Danh sách ${input.note || input.name}
                                                (Đã chọn: <span class="total-selected">${typePage === 'UPDATE' ? `<%= list${input.tableSub.toCapitalize()}.length %>` : 0}</span>)
                                            </h5>
                                            <div class="text-end">
                                                <button type="button" class="btn btn-soft-primary btn-sm btn-select-all">
                                                    Chọn tất cả
                                                </button>
                                                <button type="button" class="btn btn-soft-danger btn-sm btn-unselect-current-page">
                                                    Bỏ chọn tất cả trên trang này
                                                </button>
                                                <button type="button" class="btn btn-soft-danger btn-sm btn-unselect-all">
                                                    Bỏ chọn tất cả
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-list" style="width: 100%;">
                                            <thead>
                                                <tr>
                                                    ${outputColumnFieldsRef}
                                                    <th class="text-left">Ngày tạo</th>
                                                    <th class="text-left">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody></tbody>
                                        </table><!--end /table-->
                                    </div><!--end card-body-->
                                </div><!--end card-->
                            </div> <!-- end col -->

                        </div>

                        <div class="d-flex justify-content-end">
                            <button type="button" class="btn btn-soft-primary waves-effect waves-light me-1 btn-save-select" data-bs-dismiss="modal">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderOptionFilter(input) {
    let outputFilterBox = '';

    switch (input.type) {
        case 'text':
            outputFilterBox += `
                <div class="col-sm-8 d-flex d-none" data-follow="${input.name}" data-type="${input.type}">
                    <select class="form-select input-field-compare">
                        <option value="equal">Bằng</option>
                        <option value="not-equal">Không bằng</option>
                        <option value="start-with">Bắt đầu với</option>
                        <option value="end-with">Kết thúc với</option>
                        <option value="is-contains" selected>Có chứa</option>
                        <option value="not-contains">Không chứa</option>
                        <option value="null">Trống</option>
                    </select>

                    <input type="text" class="form-control input-field-value">
                </div>
            `;
            break;
        case 'number':
            if(check.isTrue(input.isEnum) || input.isEnum === true){
                let outputOptions = '';

                input.dataEnum.map(item => {
                    outputOptions += `<option value="${item.value}">${item.title}</option>`;
                })

                outputFilterBox += `
                    <div class="col-sm-8 d-none" data-follow="${input.name}" data-type="enum">
                        <select class="form-select input-field-compare">
                            <option value="equal" selected>Bằng</option>
                            <option value="not-equal">Không bằng</option>
                            <option value="null">Trống</option>
                        </select>

                        <select class="form-select input-select-value">
                            <option value="-1" disabled selected>Chọn ${input.note || input.name}</option>
                            ${outputOptions}
                        </select>
                    </div>
                `;
            } else{
                outputFilterBox += `
                    <div class="col-sm-8 d-flex d-none" data-follow="${input.name}" data-type="${input.type}">
                        <select class="form-select input-field-compare">
                            <option value="equal" selected>Bằng</option>
                            <option value="not-equal">Không bằng</option>
                            <option value="greater-than">Lớn hơn</option>
                            <option value="less-than">Bé hơn</option>
                            <option value="null">Trống</option>
                        </select>

                        <input type="number" class="form-control input-field-value">
                    </div>
                `;
            }
            break;
        case 'date':
            outputFilterBox += `
                <div class="col-sm-8 d-none" data-follow="${input.name}" data-type="${input.type}">
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
            `;
            break;
        default:
            break;
    }

    return outputFilterBox;
}

async function renderFilter(fields, offcanvasID) {
    let outputFilterOptions     = '';
    let outputFilterBox         = '';

	// BỘ LỌC DANH SÁCH
    for (const input of fields) {

        if(check.isTrue(input.isShowList) || input.isShowList === true){
            outputFilterBox += renderOptionFilter(input);

            // FILTER DYNAMIC
            switch (input.type) {
                case 'text':
                    outputFilterOptions += `
                        <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                    `;
                    break;
                case 'number':
                    if(check.isTrue(input.isEnum) || input.isEnum === true){
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
                    if(check.isTrue(input.isImage) || input.isImage) break;

                    if(input.ref){
                        outputFilterOptions += `<option value="${input.name}" data-type="ref">${input.note || input.name}</option>`;

                        const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() });
                        if(coll){
                            const listFields = await TYPE__COLL_COLL.find({ coll: coll._id }).lean();

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

    return `
        <div class="offcanvas offcanvas-end" tabindex="-1" id="${offcanvasID}" aria-labelledby="${offcanvasID}Label" style="width: 800px;">
            <div class="offcanvas-header">
                <h5 id="${offcanvasID}Label" class="m-0">Bộ lọc</h5>
                <button type="button" class="btn btn-danger text-white" data-bs-dismiss="offcanvas" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="offcanvas-body">

                <div class="repeater-default">
                    <div data-repeater-list="condition">

                        <div data-repeater-item="" class="d-none">
                            <div class="row d-flex justify-content-start">

                                <div class="line-condition position-relative d-none">
                                    <h2 class="type-condition" data-type-condition="AND">
                                        <span class="badge badge-soft-primary">AND</span>
                                    </h2>
                                </div>

                                <div class="col-sm-3">
                                    <select class="form-select input-field-name">
                                        <option disabled selected>Chọn trường</option>
                                        ${outputFilterOptions}
                                        <option value="rootCreateAt" data-type="date">Ngày tạo</option>
                                    </select>
                                </div>

                                ${outputFilterBox}

                                <div class="col-sm-8 d-none" data-follow="rootCreateAt" data-type="date">
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
                            <span class="btn btn-soft-secondary btn-add-filter">
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
                        <button class="btn btn-lg btn-soft-primary btn-apply-filter">
                            <i class="mdi mdi-check-all me-2"></i>
                            Áp dụng
                        </button>
                    </div>
                </div>
                <div class="col-12 col-sm-6">
                    <div class="d-grid gap-2">
                        <button class="btn btn-lg btn-soft-danger btn-discard-filter">
                            <!-- <i class="mdi mdi-alert-outline me-2"></i> -->
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderFilterListView(fields, NAME_COLL_LOWERCASE, isServerSide, collectionDescription) {
    let outputFilterDate                = '';
    let outputFilterRange               = '';
    let outputFilterEnum                = '';
    let outputFilterOptions             = '';
    let outputFilterBox                 = '';
    let outputPlaceholderInputSearch    = [];
    let outputFilterByTab               = '';

    for (const field of fields) {
        const input = field.input;

        if(outputPlaceholderInputSearch.length < 2 && input.type === 'text'){
            outputPlaceholderInputSearch = [...outputPlaceholderInputSearch, input.note || input.name];
        }

        if(check.isTrue(input.isShowList)){
            const INPUT_SELECTOR = `${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}`;
            outputFilterBox += renderOptionFilter(field.input);

            if (check.isTrue(input.isStatus)) { // SHOW TAB Ở DANH SÁCH
                input.dataEnum.map(item => {
                    outputFilterByTab += `
                        <li class="nav-item">
                            <a class="status-${NAME_COLL_LOWERCASE}-choice nav-link" _key="${input.name}" _value="${item.value}" data-bs-toggle="tab" href="#profile" role="tab" aria-selected="false">${input.note || input.name} ${item.title}</a>
                        </li>
                    `;
                })
            }

            // FILTER DYNAMIC
            switch (input.type) {
                case 'text':
                    outputFilterOptions += `
                        <option value="${input.name}" data-type="${input.type}">${input.note || input.name}</option>
                    `;
                    break;
                case 'number':
                    if(check.isTrue(input.isEnum)){
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
                    if(input.ref && !check.isTrue(input.isImage)){
                        outputFilterOptions += `<option value="${input.name}" data-type="ref">${input.note || input.name}</option>`;

                        const coll = await MANAGE__COLL_COLL.findOne({ name: input.ref.trim() });
                        if(coll){
                            const listFields = await TYPE__COLL_COLL.find({ coll }).lean();

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

            // FILTER STATIC
            switch (input.type) {
                case 'number':

                    if(check.isTrue(input.isEnum)){
                        let outputOptions = '';

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputFilterEnum += `
                            <div class="col-sm-3 ${input.name}-${NAME_COLL_LOWERCASE}">
                                <label class="form-label" for="${INPUT_SELECTOR}">
                                    ${input.note || input.name}
                                </label>
                                <select class="form-select mt-2" id="${INPUT_SELECTOR}">
                                    <option selected value="null">Chọn ${input.note || input.name}</option>
                                    ${outputOptions}
                                </select>
                            </div>
                        `;
                    }

                    if(check.isTrue(input.isCurrency)){
                        outputFilterRange += `
                            <div class="col-sm-3">
                                <label class="form-label" for="${input.name}FromNumber">
                                    ${input.note || input.name}
                                </label>
                                <div class="input-group mb-3">
                                    <input type="text" class="form-control" placeholder="Từ" id="${input.name}FromNumber" aria-label="Username">
                                    <input type="text" class="form-control" placeholder="Đến" id="${input.name}ToNumber" aria-label="Server">
                                </div>
                            </div>
                        `;
                    }

                    break;
                case 'date':
                    outputFilterDate += `
                        <div class="col-sm-3">
                            <label class="my-1">${input.note || input.name}</label>
                            <div class="input-group">  
                                <input type="text" id="${INPUT_SELECTOR}" class="form-control" autocomplete="off" data-picker="datefilter">
                                <span class="input-group-text"><i class="ti ti-calendar font-16"></i></span>
                            </div>
                        </div>
                    `;
                    break;
                default:
                    break;
            }
        }

    }


    if(!isServerSide){
        return `
            ${(outputFilterDate || outputFilterRange || outputFilterEnum) && (`
                <div class="row justify-content-center mt-3">
                    ${outputFilterDate}
                    ${outputFilterEnum}
                    ${outputFilterRange}
                    <div class="col-sm-2">
                        <button type="button" class="btn btn-primary btn-filter-${NAME_COLL_LOWERCASE}" style="margin-top:30px">
                            <i class="fas fa-search"></i>
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            `)}

            <div class="row justify-content-end ${(!outputFilterDate && !outputFilterRange && !outputFilterEnum) && 'mt-3'}">
                <div class="col-sm-6 d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2 dropdown-toggle action-${NAME_COLL_LOWERCASE}" data-bs-toggle="dropdown" aria-expanded="false">
                        Hành động <i class="mdi mdi-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item update-${NAME_COLL_LOWERCASE} d-none" href="#">
                            <i class="fas fa-edit me-1"></i>
                            Sửa
                        </a>
                        <a class="dropdown-item print-${NAME_COLL_LOWERCASE}" href="#" data-bs-toggle="modal" data-bs-target="#exampleModalDefault">
                            <i class="mdi mdi-file-export me-1"></i>
                            Export
                        </a>
                        <a class="dropdown-item delete-${NAME_COLL_LOWERCASE} d-none text-danger" href="#">
                            <i class="mdi mdi-trash-can-outline me-1"></i>
                            Xóa
                        </a>
                    </div>
                    <a href="/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}" class="btn btn-primary">
                        <i class="ti-pencil-alt"></i>
                        Tạo mới
                    </a>
                </div>
            </div>
        `;
    }

    return `
        <div class="row justify-content-center mt-3">
            <h3 class="col-sm-8 page-title"><b>Danh sách ${collectionDescription}</b> </h3>
            <div class="col-sm-4" style="text-align: right;">
                <a href="/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}" class="btn btn-primary btn-lg" >
                    <i class="ti-pencil-alt"></i>
                    Tạo mới
                </a>
            </div>
        </div>

        <ul class="nav nav-tabs" role="tablist">
            <li class="nav-item">
                <a class="status-${NAME_COLL_LOWERCASE}-choice nav-link active" _key="" _value="" data-bs-toggle="tab" href="#home" role="tab" aria-selected="true">Tất cả</a>
            </li>
            ${outputFilterByTab}
        </ul>

        <div class="row justify-content-center mt-3">

            <div class="col-sm-8">
                <div class="input-group">
                    <!-- <label class="my-2 me-2"></label> --> 
                    <input type="text" class="form-control input-search-text" autocomplete="off" placeholder="Tìm kiếm${outputPlaceholderInputSearch.map(text => ` ${text.toLowerCase()}`)},...">
                    <button class="input-group-text btn-filter">
                        <i class="ti-search"></i>
                    </button>
                    
                </div>
            </div>

            <div class="col-sm-4 d-flex justify-content-end">
            
                <button class="btn btn-outline-secondary me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
                    <i class="mdi mdi-filter-variant"></i> Bộ lọc
                </button>

                <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel" style="width: 800px;">
                    <div class="offcanvas-header">
                        <h5 id="offcanvasRightLabel" class="m-0">Bộ lọc</h5>
                        <button type="button" class="btn btn-danger text-white" data-bs-dismiss="offcanvas" aria-label="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="offcanvas-body">

                        <div class="repeater-default">
                            <div data-repeater-list="condition">

                                <div data-repeater-item="" class="d-none">
                                    <div class="row d-flex justify-content-start">

                                        <div class="line-condition position-relative d-none">
                                            <h2 class="type-condition" data-type-condition="AND">
                                                <span class="badge badge-soft-primary">AND</span>
                                            </h2>
                                        </div>

                                        <div class="col-sm-3">
                                            <select class="form-select input-field-name">
                                                <option disabled selected>Chọn trường</option>
                                                ${outputFilterOptions}
                                                <option value="rootCreateAt" data-type="date">Ngày tạo</option>
                                            </select>
                                        </div>

                                        ${outputFilterBox}

                                        <div class="col-sm-8 d-none" data-follow="rootCreateAt" data-type="date">
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
                                    <span class="btn btn-soft-secondary btn-add-filter">
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
                                <button class="btn btn-lg btn-soft-primary btn-apply-filter">
                                    <i class="mdi mdi-check-all me-2"></i>
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                        <div class="col-12 col-sm-6">
                            <div class="d-grid gap-2">
                                <button class="btn btn-lg btn-soft-danger btn-discard-filter">
                                    <!-- <i class="mdi mdi-alert-outline me-2"></i> -->
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn btn-outline-secondary download-excel-export me-2">
                    <img class="loading-excel-export d-none" src="/template/admin/assets/images/icon-loading.gif" style="width: 30px;" alt="">
                    <i class="mdi mdi-file-export me-2"></i>Export
                </button>

                <% if (ROLE_USER === 'SUPERVISOR') { %>
                    <button type="button" class="btn btn-outline-secondary print-${NAME_COLL_LOWERCASE} me-2" data-bs-toggle="modal" data-bs-target="#exampleModalDefault"><i class="far fa-file-excel me-2"></i>Cấu hình Export</button>
                <% } %>

                <button type="button" class="btn btn-outline-secondary me-2 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    Import <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu">

                    <% if (ROLE_USER === 'SUPERVISOR') { %>
                        <a class="dropdown-item setting-excel-preview" data-bs-toggle="modal" data-bs-target="#exampleModalDefault3" href="#">
                            <i class="fas fa-edit me-1"></i>
                            Cấu hình FILE Import
                        </a>
                    <% } %>

                    <a class="dropdown-item download-excel-preview" href="#">
                        <i class="fas fa-download me-1"></i>
                        Tải file mẫu
                    </a>
                    <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#exampleModalDefault2"  href="#">
                        <i class="far fa-file-excel me-1"></i>
                        Import
                    </a>
                </div>

                <button type="button" disabled class="btn btn-outline-secondary  dropdown-toggle action-${NAME_COLL_LOWERCASE}" data-bs-toggle="dropdown" aria-expanded="false">
                    Tác vụ <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item update-${NAME_COLL_LOWERCASE} d-none" href="#">
                        <i class="fas fa-edit me-1"></i>
                        Sửa
                    </a>
                    <a class="dropdown-item delete-${NAME_COLL_LOWERCASE} d-none text-danger" href="#">
                        <i class="mdi mdi-trash-can-outline me-1"></i>
                        Xóa
                    </a>
                </div>
                
            </div>
        </div>
    `;
}

async function createContentListView(fields, collectionName, isServerSide, collectionDescription, isApiAddress) {
    const NAME_COLL_UPPERCASE 	= collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE  = collectionName.toCapitalize();

    let outputtedFile = `
        <style>
            .line-condition:after{
                content: '';
                width: 520px;
                height: 1px;
                background-color: rgba(0,0,0,.1);
                position: absolute;
                top: 35px;
                left: 50px;
            }
            .type-condition{
                cursor: pointer;
            }
            .modal-backdrop.unblur{
                backdrop-filter: blur(0);
            }
            .dataTables_filter {
                display: none;
            }
            .dataTables_length{
                display: none;
            }
            .select2-container{
                margin-right: 1rem;
            }
            .checkbox label {
                display: inline-block;
                /* padding-left: 8px; */
                /* padding-left: 0 !important; */
                padding-left: 0 ;
                position: relative;
                font-weight: normal;
                margin-bottom: 12px;
            }
            .label-export {
                padding-left: 8px !important;
            }
        </style>

        <!-- Page Content-->
        <div class="page-content">
            <div class="container-fluid">
                <!-- Page-Title -->
                <div class="row d-none">
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

                ${await renderFilterListView(fields, NAME_COLL_LOWERCASE, isServerSide, collectionDescription)}

                <div class="row">
                    <div class="col-12">
                        <table id="tableList${NAME_COLL_CAPITALIZE}" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                            <thead>
                                <tr>
                                    <th class="text-center" data-orderable="false">
                                        <div class="checkbox checkbox-success">
                                            <input id="checkbox3" type="checkbox" class="check-all-record">
                                            <label for="checkbox3"></label>
                                        </div>
                                    </th>
                                    <th>STT</th>`;

    let outputHeaderTable   = ``;
    let outputRowTable      = ``;
    let isColumnFirst       = true;

    fields.map(field => {
        const input = field.input;

        if(check.isTrue(input.isShowList)){
            if (!check.isTrue(input.isApiAddress)) {
			    outputHeaderTable += `<th>${input.note || input.name}</th>`;
            }

			if(!isServerSide){
				switch (input.type) {
					case "text":
					case "number":
					case "date":
					case "boolean":
						if(check.isTrue(input.isCurrency)){
							outputRowTable += 
								`<td> 
                                    ${isColumnFirst ? (`
                                        <a href="/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=<%= ${NAME_COLL_LOWERCASE}._id %>">
                                            <%= formatCurrency('###,###.', ${NAME_COLL_LOWERCASE}.${input.name}) %>
                                        </a>
                                    `) : (`
                                        <%= formatCurrency('###,###.', ${NAME_COLL_LOWERCASE}.${input.name}) %> 
                                    `)}
								</td>`;
						}
						else if(input.formatDate){
							outputRowTable += 
								`<td> 
                                    ${isColumnFirst ? (`
                                        <a href="/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=<%= ${NAME_COLL_LOWERCASE}._id %>">
                                            <%= moment(${NAME_COLL_LOWERCASE}.${input.name}).format("${input.formatDate}") %>
                                        </a>
                                    `) : (`
                                        <%= moment(${NAME_COLL_LOWERCASE}.${input.name}).format("${input.formatDate}") %>
                                    `)}
								</td>`;
						} else if(check.isTrue(input.isEnum)){
                            if (check.isTrue(input.isStatus)) {
                                outputRowTable += `
                                    <td> 
                                        <div class="form-check form-switch form-switch-success">
                                            <input class="form-check-input check-${input.name}" _${NAME_COLL_LOWERCASE}ID=<%= ${NAME_COLL_LOWERCASE}._id %>" type="checkbox" id="<%= ${NAME_COLL_LOWERCASE}._id %>" 
                                            <% if (${NAME_COLL_LOWERCASE}.${input.name} == 1) { %>
                                                checked="" 
                                            <% } %>
                                            style="
                                                width: 40px;
                                                height: 20px;
                                            ">
                                        </div>
                                    </td>
                                `;
                            } else {
                                outputRowTable += 
								`<td>
									<span class="badge" style="background-color: <%= ${input.name.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${input.name}].color %>">
										<%= ${input.name.toUpperCase()}_${NAME_COLL_UPPERCASE}_TYPE[${NAME_COLL_LOWERCASE}.${input.name}].value %>
									</span>
								</td>`;
                            }
							
						} else if (check.isTrue(input.isOrder)) {
                            outputRowTable += 
								`<td>
                                    <input type="number" _${NAME_COLL_LOWERCASE}ID="<%= ${NAME_COLL_LOWERCASE}._id %>" class="form-control change-${input.name}" value="<%= ${NAME_COLL_LOWERCASE} && ${NAME_COLL_LOWERCASE}.${input.name} || ''%>" ">
								</td>`
                            ;
                        } else {
							outputRowTable += `<td>`;

							let content = `
								<%= ${NAME_COLL_LOWERCASE}.${input.name} && ${NAME_COLL_LOWERCASE}.${input.name}.length > 50 ? ${NAME_COLL_LOWERCASE}.${input.name}.substr(0, 50) + '...' : ${NAME_COLL_LOWERCASE}.${input.name} %> 
							`;
                            let contentFormat = '';

							// Font Style
							if(check.isTrue(input.isBold) && check.isTrue(input.isItalic)){
								contentFormat = `<b> <i> ${content} </i> </b>`;
							} else{
								if(check.isTrue(input.isBold)){
									contentFormat = `<b> ${content} </b>`;
								} else if(check.isTrue(input.isItalic)){
									contentFormat = `<i> ${content} </i>`;
								} else{
									contentFormat = content;
								}
							}

                            outputRowTable += `
                                ${isColumnFirst ? (`
                                    <a href="/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id?${NAME_COLL_LOWERCASE}ID=<%= ${NAME_COLL_LOWERCASE}._id %>">
                                        ${contentFormat}
                                    </a>
                                `) : contentFormat}
                            `;

							outputRowTable += `</td>`;
						}

						break;
					case 'object':
						if(input.ref){
							if(check.isTrue(input.isImage)){
                                console.log({
                                    input
                                });
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

								outputRowTable += 
									`<td>
										<% if(${NAME_COLL_LOWERCASE}.${input.name}){ %>
											<a class="user-avatar me-2 fancybox" href="<%= ${NAME_COLL_LOWERCASE}.${input.name}.path %>">
												<img src="<%= ${NAME_COLL_LOWERCASE}.${input.name}.path %>" alt="${NAME_COLL_LOWERCASE}" class="${styleImage}">
											</a>
										<% } %>
									</td>`;
							} else if (check.isTrue(input.isLink)) {
                                outputRowTable += `
                                    <td> 
                                        <a style="color: #0484FE;" href="/${input.ref}/update-${input.ref}-by-id?${input.ref}ID=<%= ${NAME_COLL_LOWERCASE}.${input.name}._id %>">
                                            <%= ${NAME_COLL_LOWERCASE}.${input.name} && ${NAME_COLL_LOWERCASE}.${input.name}.${input.refShow} %>
                                        </a>
                                    </td>`; 
                            } else{
								outputRowTable += 
									`<td> 
										<%= ${NAME_COLL_LOWERCASE}.${input.name} && ${NAME_COLL_LOWERCASE}.${input.name}.${input.refShow} %>
									</td>`;
							}
						}

						break;
					default:
						break;
				}
			}
        }

        isColumnFirst = false;
    })

    isApiAddress && (outputHeaderTable += `<th>Địa chỉ</th>`);

    outputtedFile += `
				${outputHeaderTable}
                <th>Ngày tạo</th>
			</tr>
		</thead>
		<tbody>
			${!isServerSide ? `
				<% if (list${NAME_COLL_CAPITALIZE}s && list${NAME_COLL_CAPITALIZE}s.length) { %>
					<% list${NAME_COLL_CAPITALIZE}s.forEach((${NAME_COLL_LOWERCASE}, index) => { %>
                        <tr>
                            <td class="text-center"> 
                                <div class="checkbox checkbox-success">
                                    <input id="<%= ${NAME_COLL_LOWERCASE}._id %>" type="checkbox" class="check-record check-record-<%= ${NAME_COLL_LOWERCASE}._id %>" _index = '<%= index + 1 %>'>
                                    <label for="<%= ${NAME_COLL_LOWERCASE}._id %>">
                                    </label>
                                </div>
                            </td>
							${outputRowTable}
                            <td>
                                <%= moment(${NAME_COLL_LOWERCASE}.createAt).format("HH:mm DD-MM-YYYY") %>
                            </td>
						</tr>
					<% }) %>
				<% } %>
			` : ''}
		</tbody>
    `;

	outputtedFile += `
					</table>
				</div>
			</div>
		</div>
        <div class="modal fade bd-example-modal-lg" id="exampleModalDefault" tabindex="-1" role="dialog" aria-labelledby="exampleModalDefaultLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title m-0" id="exampleModalDefaultLabel">Xuất Excel</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <!--end modal-header-->
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="row option-choose-export">
                                    <div class="col-lg-4">
                                        <div class="d-flex" style="
                                            justify-content: center;
                                            align-items: center;
                                        ">
                                            <h5>
                                                Chọn thuộc tính
                                            </h5>
                                            <button style="padding: 2px 10px; margin-left: 10px;" type="button" class="btn btn-warning btn-clear-all-field-choice">Bỏ Chọn Tất Cả</button>
                                        </div>
                                    </div>
                                
                                    <div class="col-lg-5">
                                        <!-- <div class="form-check form-switch form-switch-success">
                                                <input class="form-check-input" type="checkbox" id="chooseCSV" checked="" style="width: 40px;height: 20px;">
                                                <label class="form-check-label mt-1" style="margin-left: 6px;" for="chooseCSV">CSV</label>
                                            </div> -->
                                        <div class="radio radio-success">
                                            <input type="radio" class="chooseCSV" name="radio4" id="radio14" value="2" checked="">
                                            <label for="radio14">
                                                Tải xuống Excel
                                            </label>
                                        </div>
                                        <div class="radio radio-success">
                                            <input type="radio" class="chooseCSV" name="radio4" id="radio15" value="1">
                                            <label for="radio15">
                                                Tải qua GG Sheet
                                            </label>
                                        </div>
                                    </div>
                                    <!-- <div class="col-lg-3">
                                        
                                    </div> -->
                                    <p class="col-lg-3" style="text-align: right;"><span class="countItemChoice">0</span> của <span class="totalItem"></span> được chọn</p>

                                </div>

                                <ul class="list-group list-group-flush mt-3 mb-0 list-field-coll-print">

                                </ul>
                                <div class="input-group show-clip-board d-none">
                                    <input type="text" class="form-control show-url-export" id="clipboardInput" value="Welcome to Maxdot!" aria-label="Recipient's username" aria-describedby="button-addon2">
                                    <button class="btn btn-outline-secondary" type="button" id="button-addon2" data-clipboard-action="copy" data-clipboard-target="#clipboardInput"><i class="far fa-copy me-2"></i>Copy</button>
                                    <!-- <button class="btn btn-outline-secondary" type="button" id="button-addon3"  data-clipboard-action="cut" data-clipboard-target="#clipboardInput"><i class="fas fa-cut me-2"></i>Cut</button> -->
                                </div>

                            </div>
                            <!--end col-->
                        </div>
                    </div>
                    <!--end modal-body-->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-soft-primary btn-sm btn-export-excel">Xuất</button>
                        <button type="button" class="btn btn-soft-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
                    </div>
                    <!--end modal-footer-->
                </div>
                <!--end modal-content-->
            </div>
            <!--end modal-dialog-->
        </div>
        <div class="modal fade bd-example-modal-lg" id="exampleModalDefault2" tabindex="-1" role="dialog" aria-labelledby="exampleModalDefaultLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title m-0" id="exampleModalDefaultLabel">Import Excel</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <!--end modal-header-->
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="card">
                                    <!-- <div class="card-header">
                                        <h4 class="card-title">Import Excel</h4>
                                        <p class="text-muted mb-0">You can use custom tabs</p>
                                    </div> -->
                                    <div class="card-body">    
        
                                        <!-- Nav tabs -->
                                        <!-- <div class="nav-tabs-custom text-center">
                                            <ul class="nav nav-tabs" role="tablist">
                                                <li class="nav-item tab-import">
                                                    <a class="nav-link text-center active" data-bs-toggle="tab" href="#upload_file" role="tab"><i class="mdi mdi-numeric-1-circle"></i>Tải file</a>
                                                </li>
                                                <li class="nav-item tab-import">
                                                    <a class="nav-link text-center" data-bs-toggle="tab" href="#mapping_data" role="tab"><i class="mdi mdi-numeric-2-circle"></i>Mapping dữ liệu</a>
                                                </li>                                                
                                                <li class="nav-item tab-import">
                                                    <a class="nav-link text-center" data-bs-toggle="tab" href="#settings" role="tab"><i class="mdi mdi-numeric-3-circle"></i>Cài đặt</a>
                                                </li>
                                                <li class="nav-item tab-import">
                                                    <a class="nav-link text-center" data-bs-toggle="tab" href="#preview" role="tab"><i class="mdi mdi-numeric-4-circle"></i>Xem trước</a>
                                                </li>
                                                <li class="nav-item tab-import">
                                                    <a class="nav-link text-center" data-bs-toggle="tab" href="#import" role="tab"><i class="mdi mdi-numeric-5-circle"></i>Import</a>
                                                </li>
                                            </ul>
                                        </div> -->
                                        
        
                                        <!-- Tab panes -->
                                        <div class="tab-content">
                                            <div class="tab-pane active p-3" id="upload_file" role="tabpanel">
                                                <h3 class="text-center">Tải File Excel</h3>

                                                <p class="mb-0 text-muted">
                                                </p>
                                                <div class="loading-file-excel d-none d-flex" style="align-items: center; justify-content: center;">
                                                    <img src="/template/admin/assets/images/icon-loading.gif" alt="" style="">
                                                </div>
                                                <div class="form-group file-excel-upload-import">
                                                    
                                                    <input type="file" id="file__excel" data-max-file-size="10M" data-height="200" />
                                                </div>
                                            </div>
                                            <div class="tab-pane p-3" id="mapping_data" role="tabpanel">
                                                <p class="mb-0 text-muted">
                                                    Food truck fixie locavore, accusamus mcsweeney's marfa nulla.
                                                </p>
                                            </div>                                                
                                            <div class="tab-pane p-3" id="settings" role="tabpanel">
                                                <p class="text-muted mb-0">
                                                    Trust fund seitan letterpress, keytar raw denim keffiyeh etsy.
                                                </p>
                                            </div>
                                            <div class="tab-pane p-3" id="preview" role="tabpanel">
                                                <p class="text-muted mb-0">
                                                    preview
                                                </p>
                                            </div>
                                            <div class="tab-pane p-3" id="import" role="tabpanel">
                                                <p class="text-muted mb-0">
                                                    import
                                                </p>
                                            </div>
                                        </div> <!--end tab-content-->   
                                    </div><!--end card-body-->
                                </div><!--end card-->
                            
                            </div><!--end col-->
                            <!--end col-->
                        </div>
                    </div>
                    <!--end modal-body-->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-soft-primary btn-sm btn-save-import-excel">Lưu</button>
                        <button type="button" class="btn btn-soft-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
                    </div>
                    <!--end modal-footer-->
                </div>
                <!--end modal-content-->
            </div>
            <!--end modal-dialog-->
        </div>
        <div class="modal fade bd-example-modal-xl" id="exampleModalDefault3" tabindex="-1" role="dialog" aria-labelledby="exampleModalDefaultLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title m-0" id="exampleModalDefaultLabel">Tải File Excel Mẩu</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <!--end modal-header-->
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="row">
                                    <div class="col-lg-4">
                                        <div class="d-flex" style="
                                                justify-content: center;
                                                align-items: center;
                                            ">
                                            <h5>
                                                Chọn thuộc tính
                                            </h5>
                                            <button style="padding: 2px 10px; margin-left: 10px; margin-right: 100px;" type="button" class="btn btn-warning btn-clear-all-field-choice-import">Bỏ Chọn Tất Cả</button>
                                        </div>
                                    </div>

                                    <p class="col-lg-8" style="text-align: right;"><span class="count-item-choice-import"></span></p>
                                    <div class="col-lg-12" style="
                                        padding-left: 15px;
                                    ">
                                        <p style="color: black; margin-bottom: 0px;">
                                            - Những FIELD có dấu <i class="far fa-star" style="margin-left: 5px;font-size: 12px;"></i> là <b>FIELD POPULATE</b>
                                        </p>
                                        <p style="color: black; margin-bottom: 0px;">
                                            - <b>STATIC</b> chọn <b>biến</b> để import || <b>DYNAMIC</b> chọn <b>giá trị</b> của biến để import
                                        </p>
                                        <p style="color: black; margin-bottom: 0px;">
                                            - Bộ lọc <b>DYNAMIC</b> sẽ lọc giống với bộ lọc của trang danh sách
                                        </p>
                                        <p style="color: black; margin-bottom: 0px;">
                                            - Check <b>REQUIRED</b> để bắt buộc nhập các FIELD || <b>*Lưu ý</b>: Có thể coi như <b>PRIMARY KEY</b>
                                        </p>
                                        <p style="color: black; margin-bottom: 0px;">
                                            - Sau khi lọc ở <b>DYNAMIC</b>, chọn FIELD sẽ nhận giá trị IMPORT
                                        </p>
                                    </div>
                                </div>
                                
                                <ul class="list-group list-group-flush mt-3 mb-0 list-field-coll-import">

                                </ul>
                            
                                <hr>
                                <div class="row list-type-import">
                                    <h5 class="col-lg-12">
                                        Chọn Loại <b>IMPORT</b>
                                    </h5>
                                    <div class="col-sm-2">
                                        <label class="form-label">Xóa dữ liệu cũ</label>
                                        <select class="form-select input-field-type-delete">
                                            <option value="" >Chọn xóa dữ liệu</option>
                                            <option value="YES" >Xóa</option>
                                            <option value="NO" >Không xóa</option>
                                        </select>
                                    </div>

                                    <div class="col-sm-10 delete-all-record-old d-none">
                                        <div class="row">
                                            <div class="col-sm-3 ">
                                                <label class="form-label">Xóa tất cả</label>
                                                <select class="form-select input-field-type-delete-all">
                                                    <option value="" >Chọn xóa dữ liệu</option>
                                                    <option value="YES" >Xóa</option>
                                                    <option value="NO" >Xóa với điều kiện</option>
                                                </select>
                                            </div>
                                            <div class="col-sm-9 type-change-data-import d-none">
                                                <div class="row list-type-import">
                                                    <div class="col-sm-3">
                                                        <label class="form-label">Chọn điều kiện xóa</label>
                                                        <button class="btn btn-outline-secondary me-2" data-bs-target="#${NAME_COLL_LOWERCASE}ID" data-bs-toggle="modal" _ref = "${NAME_COLL_LOWERCASE}" type="button">
                                                            <i class="mdi mdi-filter-variant"></i> Bộ lọc
                                                        </button>
                                                        <div style="
                                                            margin-top: 10px;
                                                        ">
                                                            <b class="conditionDelete">

                                                            </b>
                                                            <br>
                                                            <span class="fieldDelete">
        
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="col-sm-3">
                                                        <label class="form-label">Loại lưu dữ liệu</label>
                                                        <div class="radio">
                                                            <input class="type-change-data type-change-data-delete-all" type="radio" name="radio" id="radio1" value="update">
                                                            <label for="radio1">
                                                                Insert vs Check Exist Update
                                                            </label>
                                                        </div>
                                                        <div class="radio radio-primary">
                                                            <input class="type-change-data type-change-data-delete-all" type="radio" name="radio" id="radio3" value="insert">
                                                            <label for="radio3">
                                                                Insert
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div class="col-sm-3 type-change-data-update d-none">
                                                        <label class="form-label">Chọn <b>PRIMARY KEY</b></label>
                                                        <select class="form-select input-type-change-data-update input-type-change-data-update-delete-all" multiple>
                                                            <option value="">Chọn PRIMARY KEY</option>
                                                        </select>
                                                    </div>
                                                    <div class="col-sm-3 download-old-data-with-condition d-none">
                                                        <label class="form-label">Đính kèm dữ liệu</label>
                                                        <div class="checkbox checkbox-success">
                                                            <input class="choice-download-data-old" id="btnDownloadData" type="checkbox">
                                                            <label for="btnDownloadData">
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    </div>
                                    <div class="col-sm-10  not-delete-record-old d-none">
                                        <div class="row list-type-import">
                                            <div class="col-sm-4 type-change-data-import">
                                                <label class="form-label">Loại lưu dữ liệu</label>
                                                <div class="radio">
                                                    <input class="type-change-data type-change-data-not-delete-all" type="radio" name="radio" id="radio4" value="update">
                                                    <label for="radio4">
                                                        Insert vs Check Exist Update
                                                    </label>
                                                </div>
                                                <div class="radio radio-primary">
                                                    <input class="type-change-data type-change-data-not-delete-all" type="radio" name="radio" id="radio5" value="insert">
                                                    <label for="radio5">
                                                        Insert
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-sm-6 type-change-data-update d-none">
                                                <label class="form-label">Chọn <b>PRIMARY KEY</b></label>
                                                <select class="form-select input-type-change-data-update input-type-change-data-update-not-delete-all" multiple>
                                                    <option value="">Chọn PRIMARY KEY</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                            </div>
                        </div>
                    </div>
                    <!--end modal-body-->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-soft-primary btn-sm btn-setting-excel-import">Cấu hình</button>
                        <button type="button" class="btn btn-soft-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
                    </div>
                    <!--end modal-footer-->
                </div>
                <!--end modal-content-->
            </div>
            <!--end modal-dialog-->
        </div>
        <!-- MODAL CREATE CUSTOM API -->
        <div class="modal fade bs-example-modal-sm modal-get-field-from-coll" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h6 class="modal-title">Chọn field tạo</h6>
                    </div>
                    <div class="card-body">

                        <div class="input-group mb-3 row">
                            <div class="col-12">
                                <label class="form-label"></label>
                                <div class="container-list-field-collection">
                                    <ul class="list-group"></ul>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-end">
                            <button type="button" class="btn btn-soft-primary waves-effect waves-light me-1" data-bs-dismiss="modal">
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
        <div class="list-filter-import">
        
        </div>
	`;

    return outputtedFile;
}

async function createContentAddView(fields, fieldsExcept, collectionName, collectionDescription) {
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE  = collectionName.toCapitalize();

    let outputtedFile = `
        <style>
            .dataTables_filter {
                display: none;
            }
            .select2-container{
                margin-right: 1rem;
            }
            .dataTables_empty{
                display: none;
            }
        </style>
        <!-- Page Content-->
        <div class="page-content">
            <div class="container-fluid">
                <!-- Page-Title -->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-title-box">
                            <div class="row">
                                <div class="col">
                                    <h4 class="page-title">Thêm mới ${collectionDescription || NAME_COLL_CAPITALIZE}</h4>
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="/home">Trang chủ</a></li>
                                        <li class="breadcrumb-item"><a href="/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}">Quản lý ${collectionDescription || NAME_COLL_CAPITALIZE}</a></li>
                                        <li class="breadcrumb-item active">Tạo mới</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

    let outputBoxMain       = '';
    let outputBoxImage      = '';
    let outputBoxDate       = '';
    let outputBoxDropdown   = '';
    let outputModalTableSub = '';
    let isHaveRightColumn   = false;
    let stepIndexBoxUpload  = [];

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    for (const field of fields) {
        const input = field.input;

        if(check.isTrue(input.isInsert) && !listFieldsExcept.includes(input.name)){
            switch (input.type) {
                case "text":
                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        if (check.isTrue(input.isApiAddress)) {
                            if (input.isShowSelect == 'show') {
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }
                        } else {
                            outputBoxMain += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    ${check.isTrue(input.isTextarea) ? `
                                        <textarea class="form-control" rows="4" maxlength="256" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" placeholder="${input.placeholder || ''}"></textarea>
                                    ` : `
                                        <input type="text" class="form-control" maxlength="125" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" placeholder="${input.placeholder || ''}">
                                    `}
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }
                    break;
                case "number":

                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        outputBoxMain += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="${check.isTrue(input.isCurrency) ? 'text' : 'number'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" placeholder="${input.placeholder || ''}">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    }

                    break;
                case "boolean":
                    outputBoxDropdown += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                <option value="1">True</option>
                                <option value="0">False</option>
                            </select>
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "date":
                    outputBoxDate += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <input type="${input.dateType || 'date'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "object":

                    if(input.ref){
                        if(check.isTrue(input.isImage)){
                            outputBoxImage += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <input type="file" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-max-file-size="10M" data-height="100" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} />
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        } else{
                            let fieldNameCap = input.name.toCapitalize();
                            let htmlLoadOptions = '';

                            if(!input.followBy && !check.isTrue(input.isBigData)){
                                htmlLoadOptions = `
                                    <option value="null" selected disabled>Chọn ${input.note || input.name}</option>
                                    <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                        <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                            <option value="<%= ${input.ref}._id %>">
                                                <%= ${input.ref}.${input.refShow} %>
                                            </option>
                                        <% }) %>
                                    <% } %>
                                `;
                            }

                            outputBoxDropdown += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-placeholder="Chọn ${input.note || input.name}">
                                        ${htmlLoadOptions}
                                    </select>
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }

                    break;
                case 'array':

                    if(input.ref){
                        if(check.isTrue(input.isImage)){
                            if(+input.typeUpload === 1){
                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="d-flex flex-wrap">
                                            <div class="col-3 mb-2 me-2">
                                                <input type="file" class="dropify" data-max-file-size="10M" data-height="100" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} />
                                            </div>
                                            <div class="col-button-add-more-upload" style="width: 120px;">
                                                <button type="button" class="btn btn-secondary btn-lg btn-square btn-outline-dashed btn-add-more-upload">
                                                    <i class="dripicons-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else{
                                const STEP = stepIndexBoxUpload[stepIndexBoxUpload.length - 1] || 8;
                                const START_STEP = STEP === 8 ? 0 : STEP + 1;
                                const END_STEP = START_STEP + 8 + 1;
                                stepIndexBoxUpload = [...stepIndexBoxUpload, END_STEP];

                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="box-order-line d-flex flex-wrap">
                                            <% for(let index = ${START_STEP}; index < ${END_STEP - 1}; index++) { %>

                                                <div class="box-dropzone-file dropzone-${input.name} no-file d-flex justify-content-center">
                                                    <div class="box-drag-and-drop d-flex justify-content-center align-items-center p-2" id="boxDropzoneFile-<%= index %>" data-index="<%= index %>">
                                                        <span> <i class="fas fa-plus"></i> </span>
                                                    </div>
                        
                                                    <div class="box-preview-image d-none">
                                                        <img src="https://ath2.unileverservices.com/wp-content/uploads/sites/4/2020/02/IG-annvmariv-1024x1016.jpg" alt="File" class="img-fluid me-3">
                        
                                                        <div class="edit-image">
                                                            <a href="javascript:void(0)" class="btn-edit-image">
                                                                <i class="fas fa-tools"></i>
                                                            </a>
                                                            <a href="javascript:void(0)" class="btn-remove-image">
                                                                <i class="fas fa-trash"></i>
                                                            </a>
                                                        </div>
                                                    </div>
                        
                                                    <div class="box-processing-upload-file align-items-center justify-content-center p-2 d-none">
                                                        <div class="progress">
                                                            <div class="progress-bar bg-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                                        </div>
                                                    </div>
                                                </div>
                        
                                            <% } %>
                                        </div>
                                    </div>
                                `;
                            }
                        } else{

                            if(input.tableSub){
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="form-select-table-sub">
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Tất cả ${input.note || input.name}
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="all" checked>
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Chọn ${input.note || input.name} cụ thể
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="specify">
                                                </label>
                                                <button class="btn btn-outline-primary btn-sm ms-2 d-none" id="btnOpenModalSelect${input.ref.toCapitalize()}" data-bs-toggle="modal" data-bs-target="#modalFilter${input.ref.toCapitalize()}">
                                                    Chọn ${input.note || input.name}
                                                </button>
                                            </div>
                                            <ul class="parsley-errors-list">
                                                <li class="parsley-required">This value is required.</li>
                                            </ul>
                                        </div>
                                    </div>
                                `;
                            } else{
                                let fieldNameCap = input.name.toCapitalize();
                                let htmlLoadOptions = '';

                                if(!check.isTrue(input.isBigData)){
                                    htmlLoadOptions = `
                                        <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                            <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                                <option value="<%= ${input.ref}._id %>">
                                                    <%= ${input.ref}.${input.refShow} %>
                                                </option>
                                            <% }) %>
                                        <% } %>
                                    `;
                                }

                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2 select2-multiple" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" multiple="multiple" data-placeholder="Chọn ${input.note || input.name}">
                                            ${htmlLoadOptions}
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }

                        }
                    }

                    break;
                default:
                    outputtedFile += `
                        <div class="row mb-3">
                            <div class="col-12">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="text" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        </div>
                    `;
                    break;
            }

            if(input.tableSub){
                outputModalTableSub += await renderModalSelectTableSub(input, 'INSERT');
            }
        }
    }

    if(outputBoxImage || outputBoxDropdown || outputBoxDate){
        isHaveRightColumn = true;
    }

    outputtedFile += `
            <div class="row mb-3">
                <div class="col-12 ${isHaveRightColumn ? 'col-sm-8' : ''}">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Thông tin chính</h4>
                        </div>
                        <div class="card-body">
                            ${outputBoxMain}
                        </div>
                    </div>
                </div>
                ${isHaveRightColumn ? (`
                    <div class="col-12 col-sm-4">
                        ${outputBoxImage ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Hình ảnh</h4>
                                </div>
                                <div class="card-body">
                                    ${outputBoxImage}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDropdown ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thông tin phụ</h4>
                                </div>
                                <div class="card-body">
                                    ${outputBoxDropdown}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDate ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thời gian</h4>
                                </div>
                                <div class="card-body">
                                    ${outputBoxDate}
                                </div>
                            </div>
                        `) : ''}
                    </div>
                `) : ''}
            </div>
            
        </div> <!-- container -->

        <div class="container-fluid container-button-bottom border-top pt-3 position-fixed">
            <div class="row">
                <div class="col-12 text-end mb-3">
                    <button type="button" class="btn btn-soft-primary px-4" id="btnConfirmAdd">
                        Tạo mới
                    </button>
                    <a href="/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}" class="btn btn-soft-danger px-4">
                        Quay lại danh sách
                    </a>
                </div>
            </div>
        </div>

        ${outputModalTableSub}
    `;

    return outputtedFile;
}

async function createContentUpdateView(fields, fieldsExcept, collectionName, collectionDescription) {
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE  = collectionName.toCapitalize();

    let outputtedFile = `
        <style>
            .dataTables_filter {
                display: none;
            }
            .select2-container{
                margin-right: 1rem;
            }
            .dataTables_empty{
                display: none;
            }
        </style>
        <!-- Page Content-->
        <div class="page-content">
            <div class="container-fluid">
                <!-- Page-Title -->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-title-box">
                            <div class="row">
                                <div class="col">
                                    <h4 class="page-title">Cập nhật ${collectionDescription || NAME_COLL_CAPITALIZE}</h4>
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="/home">Trang chủ</a></li>
                                        <li class="breadcrumb-item"><a href="/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}">Quản lý ${collectionDescription || NAME_COLL_CAPITALIZE}</a></li>
                                        <li class="breadcrumb-item active">Cập nhật</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

    let outputBoxMain       = '';
    let outputBoxImage      = '';
    let outputBoxDate       = '';
    let outputBoxDropdown   = '';
    let outputModalTableSub = '';
    let isHaveRightColumn   = false;
    let stepIndexBoxUpload  = [];

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    for (const field of fields) {
        const input = field.input;

        if(check.isTrue(input.isUpdate) && !listFieldsExcept.includes(input.name)){
            switch (input.type) {
                case "text":
                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        if (check.isTrue(input.isApiAddress)) {
                            if (input.isShowSelect == 'show') {
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }
                        } else {
                            outputBoxMain += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    ${check.isTrue(input.isTextarea) ? `
                                        <textarea class="form-control" rows="4" maxlength="256" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" placeholder="${input.placeholder || ''}"><%= info${NAME_COLL_CAPITALIZE}.${input.name} %></textarea>
                                    ` : `
                                        <input type="text" class="form-control" maxlength="125" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>" placeholder="${input.placeholder || ''}">
                                    `}
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }
                    break;
                case "number":

                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        outputBoxMain += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="${check.isTrue(input.isCurrency) ? 'text' : 'number'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>" placeholder="${input.placeholder || ''}">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    }

                    break;
                case "boolean":
                    outputBoxDropdown += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>">
                                <option value="1">True</option>
                                <option value="0">False</option>
                            </select>
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "date":
                    let format = 'YYYY-MM-DD';

                    switch (input.dateType) {
                        case 'datetime-local':
                            format = 'YYYY-MM-DDTHH:mm';
                            break;
                        case 'time':
                            format = 'HH:mm';
                        default:
                            break;
                    }

                    outputBoxDate += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <input type="${input.dateType || 'date'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= moment(info${NAME_COLL_CAPITALIZE}.${input.name}).format("${format}") %>">
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "object":

                    if(input.ref){
                        if(check.isTrue(input.isImage)){
                            outputBoxImage += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <input type="file" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-default-file="<%= lodash.get(info${NAME_COLL_CAPITALIZE}.${input.name}, 'path') %>" data-max-file-size="10M" data-height="100" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} />
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        } else{
                            let fieldNameCap = input.name.toCapitalize();
                            let htmlLoadOptions = '';

                            if(check.isTrue(input.isBigData)){
                                htmlLoadOptions = `
                                    <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                        <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                            <% let isSelect = (info${NAME_COLL_CAPITALIZE}.${input.name} && info${NAME_COLL_CAPITALIZE}.${input.name}._id.toString()) === ${input.ref}._id.toString() %>

                                            <option value="<%= ${input.ref}._id %>" <%= isSelect && 'selected' %>>
                                                <%= ${input.ref}.${input.refShow} %>
                                            </option>
                                        <% }) %>
                                    <% } %>
                                `;
                            } else{
                                htmlLoadOptions = `
                                    <option value="null" selected disabled>Chọn ${input.note || input.name}</option>
                                    <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                        <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                            <option value="<%= ${input.ref}._id %>">
                                                <%= ${input.ref}.${input.refShow} %>
                                            </option>
                                        <% }) %>
                                    <% } %>
                                `;
                            }

                            outputBoxDropdown += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-placeholder="Chọn ${input.note || input.name}">
                                        ${htmlLoadOptions}
                                    </select>
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }

                    break;
                case 'array':
                    if(input.ref){
                        if(check.isTrue(input.isImage)){

                            if(+input.typeUpload === 1){
                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="d-flex flex-wrap">
                                            <% if(info${NAME_COLL_CAPITALIZE}.${input.name} && info${NAME_COLL_CAPITALIZE}.${input.name}.length){ %>
                                                <% info${NAME_COLL_CAPITALIZE}.${input.name}.forEach((${input.name}, index) => { %>
                                                    <div class="col-3 mb-2 me-2">
                                                        <input type="file" class="dropify dropify-<%= index + 1 %>" data-max-file-size="10M" data-height="100" data-default-file="<%= ${input.name}.path %>" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} data-path="<%= ${input.name}.path %>" data-name="<%= ${input.name}.name %>" data-size="<%= ${input.name}.size %>" />
                                                        <!-- https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png -->
                                                    </div>
                                                <% }) %>
                                            <% } %>
                                            <div class="col-button-add-more-upload" style="width: 120px;">
                                                <button type="button" class="btn btn-secondary btn-lg btn-square btn-outline-dashed btn-add-more-upload">
                                                    <i class="dripicons-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else{
                                const STEP = stepIndexBoxUpload[stepIndexBoxUpload.length - 1] || 8;
                                const START_STEP = STEP === 8 ? 0 : STEP + 1;
                                const END_STEP = START_STEP + 8 + 1;
                                stepIndexBoxUpload = [...stepIndexBoxUpload, END_STEP];

                                let forLoop = [];

                                if(STEP !== 8){
                                    forLoop.push({
                                        for: `<% for(let i = ${START_STEP}, index = 0; i < ${END_STEP - 1}; i++, index++) { %>`,
                                        index: 'index'
                                    })
                                } else{
                                    forLoop.push({
                                        for: `<% for(let i = ${START_STEP}; i < ${END_STEP - 1}; i++) { %>`,
                                        index: 'i'
                                    })
                                }

                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="box-order-line d-flex flex-wrap">
                                            ${forLoop[0].for}
                                                <% 
                                                    let image = false;
                                                    let path  = '';

                                                    if(info${NAME_COLL_CAPITALIZE}.${input.name}[${forLoop[0].index}]){
                                                        image = info${NAME_COLL_CAPITALIZE}.${input.name}[${forLoop[0].index}]; 
                                                        path  = lodash.get(image, 'path', '');
                                                    }
                                                %>

                                                <div class="box-dropzone-file dropzone-${input.name} no-file d-flex justify-content-center">
                                                    <div class="box-drag-and-drop d-flex justify-content-center align-items-center p-2 <%= image && 'd-none' %>" id="boxDropzoneFile-<%= i + 1 %>" data-index="<%= i + 1 %>" name="<%= lodash.get(image, 'name', '') %>" path="<%= lodash.get(image, 'path', '') %>" size="<%= lodash.get(image, 'size', '') %>">
                                                        <span> <i class="fas fa-plus"></i> </span>
                                                    </div>
                        
                                                    <div class="box-preview-image <%= !image && 'd-none' %>">
                                                        <img src="<%= path %>" alt="File" class="img-fluid me-3">
                        
                                                        <div class="edit-image">
                                                            <a href="javascript:void(0)" class="btn-edit-image">
                                                                <i class="fas fa-tools"></i>
                                                            </a>
                                                            <a href="javascript:void(0)" class="btn-remove-image">
                                                                <i class="fas fa-trash"></i>
                                                            </a>
                                                        </div>
                                                    </div>
                        
                                                    <div class="box-processing-upload-file align-items-center justify-content-center p-2 d-none">
                                                        <div class="progress">
                                                            <div class="progress-bar bg-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                                        </div>
                                                    </div>
                                                </div>
                        
                                            <% } %>
                                        </div>
                                    </div>
                                `;
                            }
                            
                        } else{
                            let fieldNameCap = input.name.toCapitalize();

                            if(input.tableSub){
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div>
                                            <% let hasSelect = list${input.tableSub.toCapitalize()}.length %>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Tất cả ${input.note || input.name}
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="all" <%= !hasSelect && 'checked' %>>
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Chọn ${input.note || input.name} cụ thể
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="specify" <%= hasSelect && 'checked' %>>
                                                </label>
                                                <button class="btn btn-outline-primary btn-sm ms-2 <%= !hasSelect && 'd-none' %>" id="btnOpenModalSelect${input.ref.toCapitalize()}" data-bs-toggle="modal" data-bs-target="#modalFilter${input.ref.toCapitalize()}">
                                                    <% if (hasSelect) { %>
                                                        Đã chọn <%= list${input.tableSub.toCapitalize()}.length %> ${input.note || input.name}
                                                    <% } else{ %>
                                                        Chọn ${input.note || input.name}
                                                    <% } %>
                                                </button>
                                            </div>
                                            <ul class="parsley-errors-list">
                                                <li class="parsley-required">This value is required.</li>
                                            </ul>
                                        </div>
                                    </div>
                                `;
                            } else{
                                let htmlLoadOptions = '';

                                if(check.isTrue(input.isBigData)){
                                    htmlLoadOptions = `
                                        <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                            <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                                <option value="<%= ${input.ref}._id %>">
                                                    <%= ${input.ref}.${input.refShow} %>
                                                </option>
                                            <% }) %>
                                        <% } %>
                                    `;
                                } else{
                                    htmlLoadOptions = `
                                        <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                            <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                                <option value="<%= ${input.ref}._id %>">
                                                    <%= ${input.ref}.${input.refShow} %>
                                                </option>
                                            <% }) %>
                                        <% } %>
                                    `;
                                }

                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2 select2-multiple" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" multiple="multiple" data-placeholder="Chọn ${input.note || input.name}">
                                            ${htmlLoadOptions}
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }

                        }
                    }

                    break;
                default:
                    outputtedFile += `
                        <div class="row mb-3">
                            <div class="col-12">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="text" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE}.${input.name} %>">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        </div>
                    `;
                    break;
            }

            if(input.tableSub){
                outputModalTableSub += await renderModalSelectTableSub(input, 'UPDATE');
            }
        }
    }

    if(outputBoxImage || outputBoxDropdown || outputBoxDate){
        isHaveRightColumn = true;
    }

    outputtedFile += `
            <div class="row mb-3">
                <div class="col-12 ${isHaveRightColumn ? 'col-sm-8' : ''}">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Thông tin chính</h4>
                            <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                        </div>
                        <div class="card-body">
                            ${outputBoxMain}
                        </div>
                    </div>
                </div>
                ${isHaveRightColumn ? (`
                    <div class="col-12 col-sm-4">
                        ${outputBoxImage ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Hình ảnh</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxImage}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDropdown ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thông tin phụ</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxDropdown}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDate ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thời gian</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxDate}
                                </div>
                            </div>
                        `) : ''}
                    </div>
                `) : ''}
            </div>

        </div> <!-- container -->

        <div class="container-fluid container-button-bottom border-top pt-3 position-fixed">
            <div class="row">
                <div class="col-12 text-end mb-3">
                    <button type="button" class="btn btn-soft-primary px-4" disabled id="btnConfirmUpdate" __${NAME_COLL_LOWERCASE}ID="<%= info${NAME_COLL_CAPITALIZE}._id %>">
                        Cập nhật
                    </button>
                    <a href="/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}" class="btn btn-soft-danger px-4">
                        Quay lại danh sách
                    </a>
                </div>
            </div>
        </div>

        ${outputModalTableSub}
    `;

    return outputtedFile;
}

async function createContentAddView__SystemConfig(fields, fieldsExcept, collectionName, collectionDescription) {
    const NAME_COLL_LOWERCASE 	= collectionName.toLowerCase();
    const NAME_COLL_CAPITALIZE  = collectionName.toCapitalize();

    let outputtedFile = `
        <style>
            .dataTables_filter {
                display: none;
            }
            .select2-container{
                margin-right: 1rem;
            }
            .dataTables_empty{
                display: none;
            }
        </style>
        <!-- Page Content-->
        <div class="page-content">
            <div class="container-fluid">
                <!-- Page-Title -->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-title-box">
                            <div class="row">
                                <div class="col">
                                    <h4 class="page-title">Thông tin ${collectionDescription || NAME_COLL_CAPITALIZE}</h4>
                                    <ol class="breadcrumb">
                                        <li class="breadcrumb-item"><a href="/home">Trang chủ</a></li>
                                        <li class="breadcrumb-item"><a href="/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}">Quản lý ${collectionDescription || NAME_COLL_CAPITALIZE}</a></li>
                                        <li class="breadcrumb-item active">Thay đổi thông tin</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

    let outputBoxMain       = '';
    let outputBoxImage      = '';
    let outputBoxDate       = '';
    let outputBoxDropdown   = '';
    let outputModalTableSub = '';
    let isHaveRightColumn   = false;
    let stepIndexBoxUpload  = [];

    let listFieldsExcept = [];

    if(fieldsExcept && fieldsExcept.length){
        fieldsExcept.map(field => {
            listFieldsExcept = [...listFieldsExcept, ...field.listFieldsChoosed];
        });
    }

    for (const field of fields) {
        const input = field.input;

        if(check.isTrue(input.isInsert) && !listFieldsExcept.includes(input.name)){
            switch (input.type) {
                case "text":
                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        if (check.isTrue(input.isApiAddress)) {
                            if (input.isShowSelect == 'show') {
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }
                        } else {
                            outputBoxMain += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    ${check.isTrue(input.isTextarea) ? `
                                        <textarea class="form-control" rows="4" maxlength="256" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" placeholder="${input.placeholder || ''}"><%= info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} %></textarea>
                                    ` : `
                                        <input type="text" class="form-control" maxlength="125" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} %>" placeholder="${input.placeholder || ''}">
                                    `}
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }
                    break;
                case "number":

                    if(check.isTrue(input.isEnum)){
                        let outputOptions = `<option selected disabled>Chọn ${input.note || input.name}</option>`;

                        input.dataEnum.map(item => {
                            outputOptions += `<option value="${item.value}">${item.title}</option>`;
                        })

                        outputBoxDropdown += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${outputOptions}
                                </select>
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    } else{
                        outputBoxMain += `
                            <div class="form-group">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="${check.isTrue(input.isCurrency) ? 'text' : 'number'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} %>" placeholder="${input.placeholder || ''}">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        `;
                    }

                    break;
                case "boolean":
                    outputBoxDropdown += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} %>">
                                <option value="1">True</option>
                                <option value="0">False</option>
                            </select>
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "date":
                    let format = 'YYYY-MM-DD';

                    switch (input.dateType) {
                        case 'datetime-local':
                            format = 'YYYY-MM-DDTHH:mm';
                            break;
                        case 'time':
                            format = 'HH:mm';
                        default:
                            break;
                    }

                    outputBoxDate += `
                        <div class="form-group">
                            <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                            </label>
                            <input type="${input.dateType || 'date'}" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%= moment(info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name}).format("${format}") %>">
                            <ul class="parsley-errors-list">
                                <li class="parsley-required">This value is required.</li>
                            </ul>
                        </div>
                    `;
                    break;
                case "object":

                    if(input.ref){
                        if(check.isTrue(input.isImage)){
                            outputBoxImage += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <input type="file" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-default-file="<%= lodash.get(info${NAME_COLL_CAPITALIZE}.${input.name}, 'path') %>" data-max-file-size="10M" data-height="100" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} />
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        } else{
                            let fieldNameCap = input.name.toCapitalize();
                            let htmlLoadOptions = '';

                            if(check.isTrue(input.isBigData)){
                                htmlLoadOptions = `
                                    <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                        <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                            <% let isSelect = (info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} && info${NAME_COLL_CAPITALIZE}.${input.name}._id.toString()) === ${input.ref}._id.toString() %>

                                            <option value="<%= ${input.ref}._id %>" <%= isSelect && 'selected' %>>
                                                <%= ${input.ref}.${input.refShow} %>
                                            </option>
                                        <% }) %>
                                    <% } %>
                                `;
                            } else{
                                htmlLoadOptions = `
                                    <option value="null" selected disabled>Chọn ${input.note || input.name}</option>
                                    <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                        <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                            <%
                                                let selected = '';
                                                if (info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} && ${input.ref}._id.toString() == info${NAME_COLL_CAPITALIZE}.${input.name}._id.toString()) {
                                                    selected = 'selected';
                                                }
                                            %>
                                            <option value="<%= ${input.ref}._id %>" <%= selected %>>
                                                <%= ${input.ref}.${input.refShow} %>
                                            </option>
                                        <% }) %>
                                    <% } %>
                                `;
                            }

                            outputBoxDropdown += `
                                <div class="form-group">
                                    <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                        ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                    </label>
                                    <select class="form-select mt-2" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" data-placeholder="Chọn ${input.note || input.name}">
                                        ${htmlLoadOptions}
                                    </select>
                                    <ul class="parsley-errors-list">
                                        <li class="parsley-required">This value is required.</li>
                                    </ul>
                                </div>
                            `;
                        }
                    }

                    break;
                case 'array':
                    if(input.ref){
                        if(check.isTrue(input.isImage)){

                            if(+input.typeUpload === 1){
                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="d-flex flex-wrap">
                                            <% if(info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} && info${NAME_COLL_CAPITALIZE}.${input.name}.length){ %>
                                                <% info${NAME_COLL_CAPITALIZE}.${input.name}.forEach((${input.name}, index) => { %>
                                                    <div class="col-3 mb-2 me-2">
                                                        <input type="file" class="dropify dropify-<%= index + 1 %>" data-max-file-size="10M" data-height="100" data-default-file="<%= ${input.name}.path %>" ${input.fileType ? `data-allowed-file-extensions="${input.fileType}"` : ''} data-path="<%= ${input.name}.path %>" data-name="<%= ${input.name}.name %>" data-size="<%= ${input.name}.size %>" />
                                                        <!-- https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png -->
                                                    </div>
                                                <% }) %>
                                            <% } %>
                                            <div class="col-button-add-more-upload" style="width: 120px;">
                                                <button type="button" class="btn btn-secondary btn-lg btn-square btn-outline-dashed btn-add-more-upload">
                                                    <i class="dripicons-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else{
                                const STEP = stepIndexBoxUpload[stepIndexBoxUpload.length - 1] || 8;
                                const START_STEP = STEP === 8 ? 0 : STEP + 1;
                                const END_STEP = START_STEP + 8 + 1;
                                stepIndexBoxUpload = [...stepIndexBoxUpload, END_STEP];

                                let forLoop = [];

                                if(STEP !== 8){
                                    forLoop.push({
                                        for: `<% for(let i = ${START_STEP}, index = 0; i < ${END_STEP - 1}; i++, index++) { %>`,
                                        index: 'index'
                                    })
                                } else{
                                    forLoop.push({
                                        for: `<% for(let i = ${START_STEP}; i < ${END_STEP - 1}; i++) { %>`,
                                        index: 'i'
                                    })
                                }

                                outputBoxMain += `
                                    <div class="form-group">
                                        <label class="form-label">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div class="box-order-line d-flex flex-wrap">
                                            ${forLoop[0].for}
                                                <% 
                                                    let image = false;
                                                    let path  = '';

                                                    if(info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name}[${forLoop[0].index}]){
                                                        image = info${NAME_COLL_CAPITALIZE}.${input.name}[${forLoop[0].index}]; 
                                                        path  = lodash.get(image, 'path', '');
                                                    }
                                                %>

                                                <div class="box-dropzone-file dropzone-${input.name} no-file d-flex justify-content-center">
                                                    <div class="box-drag-and-drop d-flex justify-content-center align-items-center p-2 <%= image && 'd-none' %>" id="boxDropzoneFile-<%= i + 1 %>" data-index="<%= i + 1 %>" name="<%= lodash.get(image, 'name', '') %>" path="<%= lodash.get(image, 'path', '') %>" size="<%= lodash.get(image, 'size', '') %>">
                                                        <span> <i class="fas fa-plus"></i> </span>
                                                    </div>
                        
                                                    <div class="box-preview-image <%= !image && 'd-none' %>">
                                                        <img src="<%= path %>" alt="File" class="img-fluid me-3">
                        
                                                        <div class="edit-image">
                                                            <a href="javascript:void(0)" class="btn-edit-image">
                                                                <i class="fas fa-tools"></i>
                                                            </a>
                                                            <a href="javascript:void(0)" class="btn-remove-image">
                                                                <i class="fas fa-trash"></i>
                                                            </a>
                                                        </div>
                                                    </div>
                        
                                                    <div class="box-processing-upload-file align-items-center justify-content-center p-2 d-none">
                                                        <div class="progress">
                                                            <div class="progress-bar bg-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                                        </div>
                                                    </div>
                                                </div>
                        
                                            <% } %>
                                        </div>
                                    </div>
                                `;
                            }
                            
                        } else{
                            let fieldNameCap = input.name.toCapitalize();

                            if(input.tableSub){
                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <div>
                                            <% let hasSelect = list${input.tableSub.toCapitalize()}.length %>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Tất cả ${input.note || input.name}
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="all" <%= !hasSelect && 'checked' %>>
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    Chọn ${input.note || input.name} cụ thể
                                                    <input class="form-check-input" type="radio" name="rdOptions${input.ref.toCapitalize()}" value="specify" <%= hasSelect && 'checked' %>>
                                                </label>
                                                <button class="btn btn-outline-primary btn-sm ms-2 <%= !hasSelect && 'd-none' %>" id="btnOpenModalSelect${input.ref.toCapitalize()}" data-bs-toggle="modal" data-bs-target="#modalFilter${input.ref.toCapitalize()}">
                                                    <% if (hasSelect) { %>
                                                        Đã chọn <%= list${input.tableSub.toCapitalize()}.length %> ${input.note || input.name}
                                                    <% } else{ %>
                                                        Chọn ${input.note || input.name}
                                                    <% } %>
                                                </button>
                                            </div>
                                            <ul class="parsley-errors-list">
                                                <li class="parsley-required">This value is required.</li>
                                            </ul>
                                        </div>
                                    </div>
                                `;
                            } else{
                                let htmlLoadOptions = '';

                                if(check.isTrue(input.isBigData)){
                                    htmlLoadOptions = `
                                        <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                            <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                                <option value="<%= ${input.ref}._id %>">
                                                    <%= ${input.ref}.${input.refShow} %>
                                                </option>
                                            <% }) %>
                                        <% } %>
                                    `;
                                } else{
                                    htmlLoadOptions = `
                                        <% if(list${fieldNameCap}s && list${fieldNameCap}s.length){ %>
                                            <% list${fieldNameCap}s.forEach(${input.ref} => { %>
                                                <option value="<%= ${input.ref}._id %>">
                                                    <%= ${input.ref}.${input.refShow} %>
                                                </option>
                                            <% }) %>
                                        <% } %>
                                    `;
                                }

                                outputBoxDropdown += `
                                    <div class="form-group">
                                        <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                            ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                        </label>
                                        <select class="form-select mt-2 select2-multiple" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" multiple="multiple" data-placeholder="Chọn ${input.note || input.name}">
                                            ${htmlLoadOptions}
                                        </select>
                                        <ul class="parsley-errors-list">
                                            <li class="parsley-required">This value is required.</li>
                                        </ul>
                                    </div>
                                `;
                            }

                        }
                    }

                    break;
                default:
                    outputtedFile += `
                        <div class="row mb-3">
                            <div class="col-12">
                                <label class="form-label" for="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}">
                                    ${input.note || input.name} ${check.isTrue(input.isRequire) ? '<span class="text-danger">(*)</span>' : ''}
                                </label>
                                <input type="text" class="form-control" id="${NAME_COLL_LOWERCASE}__${input.name.toLowerCase()}" value="<%=info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}.${input.name} %>">
                                <ul class="parsley-errors-list">
                                    <li class="parsley-required">This value is required.</li>
                                </ul>
                            </div>
                        </div>
                    `;
                    break;
            }

            if(input.tableSub){
                outputModalTableSub += await renderModalSelectTableSub(input, 'UPDATE');
            }
        }
    }

    if(outputBoxImage || outputBoxDropdown || outputBoxDate){
        isHaveRightColumn = true;
    }

    outputtedFile += `
            <div class="row mb-3">
                <div class="col-12 ${isHaveRightColumn ? 'col-sm-8' : ''}">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Thông tin chính</h4>
                            <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                        </div>
                        <div class="card-body">
                            ${outputBoxMain}
                        </div>
                    </div>
                </div>
                ${isHaveRightColumn ? (`
                    <div class="col-12 col-sm-4">
                        ${outputBoxImage ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Hình ảnh</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxImage}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDropdown ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thông tin phụ</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxDropdown}
                                </div>
                            </div>
                        `) : ''}
                        ${outputBoxDate ? (`
                            <div class="card">
                                <div class="card-header">
                                    <h4 class="card-title">Thời gian</h4>
                                    <!-- <p class="text-muted mb-0">An example of Bootstrap Material DatePicker.</p> -->
                                </div>
                                <div class="card-body">
                                    ${outputBoxDate}
                                </div>
                            </div>
                        `) : ''}
                    </div>
                `) : ''}
            </div>

        </div> <!-- container -->

        <div class="container-fluid container-button-bottom border-top pt-3 position-fixed">
            <div class="row">
                <div class="col-12 text-end mb-3">
                    <button type="button" class="btn btn-soft-primary px-4" id="btnConfirmAdd" __${NAME_COLL_LOWERCASE}ID="<%= info${NAME_COLL_CAPITALIZE} && info${NAME_COLL_CAPITALIZE}._id %>">
                        Cập nhật
                    </button>
                    <a href="/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}" class="btn btn-soft-danger px-4">
                        Quay lại danh sách
                    </a>
                </div>
            </div>
        </div>

        ${outputModalTableSub}
    `;

    return outputtedFile;
}

module.exports.generateView = async (collectionName, collectionDescription, fields, fieldsExcept, pathSave, isServerSide, folderName, conditionCreatePackage, isApiAddress, icon, isSystemConfig) => {
    return new Promise(async resolve => {
        try {
            const NAME_COLL_LOWERCASE 		= collectionName.toLowerCase();
            let fileName 					= pathSave;
            let outputtedFileScriptCommon   = createContentScriptCommon();

            const { isCreateView, isCreateScript } = conditionCreatePackage;

            let outputtedFileListView           = '';
            let outputtedFileAddView            = '';
            let outputtedFileUpdateView         = '';

            let outputtedFileScriptListView     = '';
            let outputtedFileScriptAddView      = '';
            let outputtedFileScriptUpdateView   = '';

            if(check.isTrue(isCreateView)){
                outputtedFileListView           = await createContentListView(fields, collectionName, isServerSide, collectionDescription, isApiAddress);
                outputtedFileUpdateView         = await createContentUpdateView(fields, fieldsExcept, collectionName, collectionDescription);

                if (isSystemConfig) {
                    console.log("-----------isSystemConfig-----------");
                    outputtedFileAddView            = await createContentAddView__SystemConfig(fields, fieldsExcept, collectionName, collectionDescription);
                } else {
                    outputtedFileAddView            = await createContentAddView(fields, fieldsExcept, collectionName, collectionDescription);
                }

                outputtedFileListView           = beautifyerHTML(outputtedFileListView);
                outputtedFileAddView            = beautifyerHTML(outputtedFileAddView);
                outputtedFileUpdateView         = beautifyerHTML(outputtedFileUpdateView);
            }
    
            if(check.isTrue(isCreateScript)){
                outputtedFileScriptListView     = createContentScriptListView(fields, collectionName, collectionDescription, isServerSide, isApiAddress);
                outputtedFileScriptAddView      = await createContentScriptAddView(fields, fieldsExcept, collectionName, collectionDescription);
                outputtedFileScriptUpdateView   = await createContentScriptUpdateView(fields, fieldsExcept, collectionName, collectionDescription);

                outputtedFileScriptListView     = beautifyerHTML(outputtedFileScriptListView);
                outputtedFileScriptAddView      = beautifyerHTML(outputtedFileScriptAddView);
                outputtedFileScriptUpdateView   = beautifyerHTML(outputtedFileScriptUpdateView);
            }

            fs.access(fileName, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                    logger.error(err);
                    return resolve({ 
                        error: true, message: `Can't access path ${fileName} or permission denined` 
                    });
                }

                const fileNameScriptCommon = `${fileName}/www/views/inc/supervisor/scripts/main-script.ejs`;

                if(!fs.existsSync(fileNameScriptCommon)){
                    fs.writeFileSync(fileNameScriptCommon, outputtedFileScriptCommon);
                }

                fs.readFile(`${pathSave}/www/views/index.ejs`, (err, data) => {
                    if(err){
                        log(chalk.red(err));
                        return resolve({ error: true, message: err });
                    }

                    if(!data.includes(`main-script.ejs`)){
                        fs.appendFileSync(`${pathSave}/www/views/index.ejs`, `\n<%- include('./inc/supervisor/scripts/main-script.ejs') %>\n`);
                    }
                });

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

                if(check.isTrue(isCreateView)){
                    tool.appendLeftbar(`${pathSave}/www/views/inc/admin/utils/leftbar.ejs`, collectionName, collectionDescription, folderName, icon, isSystemConfig);
                }

                const fileNameListView          = `${fileName}/views/${NAME_COLL_LOWERCASE}/list_${NAME_COLL_LOWERCASE}s.ejs`;
                const fileNameAddView           = `${fileName}/views/${NAME_COLL_LOWERCASE}/add_${NAME_COLL_LOWERCASE}.ejs`;
                const fileNameUpdateView        = `${fileName}/views/${NAME_COLL_LOWERCASE}/update_${NAME_COLL_LOWERCASE}.ejs`;

                const fileNameScriptListView    = `${fileName}/views/${NAME_COLL_LOWERCASE}/scripts/list_${NAME_COLL_LOWERCASE}s-script.ejs`;
                const fileNameScriptAddView     = `${fileName}/views/${NAME_COLL_LOWERCASE}/scripts/add_${NAME_COLL_LOWERCASE}-script.ejs`;
                const fileNameScriptUpdateView  = `${fileName}/views/${NAME_COLL_LOWERCASE}/scripts/update_${NAME_COLL_LOWERCASE}-script.ejs`;

                if(check.isTrue(isCreateView)){
                    fs.writeFileSync(fileNameListView, outputtedFileListView);
                    fs.writeFileSync(fileNameAddView, outputtedFileAddView);
                    fs.writeFileSync(fileNameUpdateView, outputtedFileUpdateView);

                    log(chalk.green(`Create view success!! in the directory ${fileName}`));
                }

                if(check.isTrue(isCreateScript)){
                    fs.writeFileSync(fileNameScriptListView, outputtedFileScriptListView);
                    fs.writeFileSync(fileNameScriptAddView, outputtedFileScriptAddView);
                    fs.writeFileSync(fileNameScriptUpdateView, outputtedFileScriptUpdateView);

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
    
                        if(!data.includes(`/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}/:field/:value`)){
                            fs.appendFileSync(`${pathSave}/www/views/index.ejs`, (`
                                <% if (render.code === "/${NAME_COLL_LOWERCASE}/list-${NAME_COLL_LOWERCASE}/:field/:value") { %>
                                    <%- include('../packages/${folderName.toLowerCase()}/views/${NAME_COLL_LOWERCASE}/scripts/list_${NAME_COLL_LOWERCASE}s-script.ejs') %>
                                <% } %>
                            `));
                        }
    
                        if(!data.includes(`/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}`)){
                            fs.appendFileSync(`${pathSave}/www/views/index.ejs`, (`
                                <% if (render.code === "/${NAME_COLL_LOWERCASE}/add-${NAME_COLL_LOWERCASE}") { %>
                                    <%- include('../packages/${folderName.toLowerCase()}/views/${NAME_COLL_LOWERCASE}/scripts/add_${NAME_COLL_LOWERCASE}-script.ejs') %>
                                <% } %>
                            `))
                        }
    
                        if(!data.includes(`/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id`)){
                            fs.appendFileSync(`${pathSave}/www/views/index.ejs`, (`
                                <% if (render.code === "/${NAME_COLL_LOWERCASE}/update-${NAME_COLL_LOWERCASE}-by-id") { %>
                                    <%- include('../packages/${folderName.toLowerCase()}/views/${NAME_COLL_LOWERCASE}/scripts/update_${NAME_COLL_LOWERCASE}-script.ejs') %>
                                <% } %>
                            `))
                        }
                    })
                }

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
