const BASE_ROUTE = '/admin';

const CF_ROUTINGS_API = {

    // API IDENTIFIER
	LIST_API: `${BASE_ROUTE}/apis`,
	ADD_API: `${BASE_ROUTE}/add-api`,
	DETAIL_API: `${BASE_ROUTE}/detail-api/:api`,
    UPDATE_API: `${BASE_ROUTE}/update-api`,
    DELETE_API: `${BASE_ROUTE}/delete-api`,

    // API SCOPE
	ADD_SCOPE: `${BASE_ROUTE}/add-scope`,
    DELETE_SCOPE: `${BASE_ROUTE}/delete-scope`,
    LIST_SCOPE_BY_API: `${BASE_ROUTE}/list-scope-by-api`,

    ORIGIN_APP: BASE_ROUTE
}

exports.CF_ROUTINGS_API = CF_ROUTINGS_API;
