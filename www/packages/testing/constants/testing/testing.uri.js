const BASE_ROUTE = '/testing';
const API_BASE_ROUTE = '/api/testing';

const CF_ROUTINGS_TESTING = {
    ADD_TESTING: `${BASE_ROUTE}/add-testing`,
    UPDATE_TESTING_BY_ID: `${BASE_ROUTE}/update-testing-by-id`,
    DELETE_TESTING_BY_ID: `${BASE_ROUTE}/delete/:testingID`,

    GET_INFO_TESTING_BY_ID: `${BASE_ROUTE}/info/:testingID`,
    GET_LIST_TESTING: `${BASE_ROUTE}/list-testing`,
    GET_LIST_TESTING_BY_FIELD: `${BASE_ROUTE}/list-testing/:field/:value`,
    GET_LIST_TESTING_SERVER_SIDE: `${BASE_ROUTE}/list-testing-server-side`,

    UPDATE_TESTING_NOT_REQUIRE_BY_ID: `${BASE_ROUTE}/update-testing-by-id-v2`,
    DELETE_TESTING_BY_LIST_ID: `${BASE_ROUTE}/delete-testing-by-list-id`,

    // EXPORT EXCEL
    GET_LIST_TESTING_EXCEL: `${BASE_ROUTE}/list-testing-excel`,
    DOWNLOAD_LIST_TESTING_EXCEL_EXPORT: `${BASE_ROUTE}/dowload-testing-excel-export`,

    // IMPORT EXCEL
    GET_LIST_TESTING_IMPORT: `${BASE_ROUTE}/list-testing-import`,
    SETTING_FILE_TESTING_EXCEL_IMPORT_PREVIEW: `${BASE_ROUTE}/list-testing-import-setting`,
    DOWNLOAD_FILE_TESTING_EXCEL_IMPORT: `${BASE_ROUTE}/list-testing-import-dowload`,
    CREATE_TESTING_IMPORT_EXCEL: `${BASE_ROUTE}/create-testing-import-excel`,



    ORIGIN_APP: BASE_ROUTE,
}

exports.CF_ROUTINGS_TESTING = CF_ROUTINGS_TESTING;