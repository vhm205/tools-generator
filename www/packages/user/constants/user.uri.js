const BASE_ROUTE = '/admin';

const CF_ROUTINGS_USER = {
	LIST_USER:   `${BASE_ROUTE}/list-admin`,
	ADD_USER:    `${BASE_ROUTE}/add-admin`,
	INFO_USER:   `${BASE_ROUTE}/info-admin`,
    UPDATE_USER: `${BASE_ROUTE}/update-admin`,
    DELETE_USER: `${BASE_ROUTE}/delete-admin`,

    ORIGIN_APP: BASE_ROUTE
}

exports.CF_ROUTINGS_USER = CF_ROUTINGS_USER;
