const BASE_ROUTE = '/admin';

const CF_ROUTINGS_TRIGGER_EVENT = {
    TRIGGER_EVENT               : `${BASE_ROUTE}/trigger-event`,

    // FUNCTIONS
    INSERT_FUNCTIONS            : `${BASE_ROUTE}/insert-functions`,
    CHECK_EXISTS_FUNCTIONS      : `${BASE_ROUTE}/check-exists-function`,

    // TEMPLATES NOTIFICATION
    INSERT_TEMPLATES            : `${BASE_ROUTE}/insert-templates`,
    GET_INFO_TEMPLATE           : `${BASE_ROUTE}/info-template`,

    // EVENTS
    INSERT_EVENTS               : `${BASE_ROUTE}/insert-events`,

    ORIGIN_APP: BASE_ROUTE
}

exports.CF_ROUTINGS_TRIGGER_EVENT = CF_ROUTINGS_TRIGGER_EVENT;