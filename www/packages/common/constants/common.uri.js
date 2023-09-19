const BASE_ROUTE = '/admin';

const CF_ROUTINGS_COMMON = {
    SOMETHING_WRONG         : '/something-went-wrong',
    LOGIN                   : `/login`,
    LOGOUT                  : `/logout`,

    LIST_PROVINCES          : `/list-provinces`,
    LIST_DISTRICTS          : `/list-districts/:province`,
    LIST_WARDS              : `/list-wards/:district`,

    UPLOAD_FILE             : `/upload-file`,
    PUSH_JOB_TO_QUEUE       : `/queue/push`,

    ORIGIN_APP: BASE_ROUTE
}

exports.CF_ROUTINGS_COMMON = CF_ROUTINGS_COMMON;