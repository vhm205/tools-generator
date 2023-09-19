const BASE_ROUTE = '/admin';

const CF_ROUTINGS_ROLE = {
    // ROLE PERMISSION
	LIST_ROLES: `${BASE_ROUTE}/roles`,
	LIST_USERS: `${BASE_ROUTE}/users`,

	ADD_ROLE: `${BASE_ROUTE}/add-role`,
	DETAIL_ROLE: `${BASE_ROUTE}/detail-role/:role`,
    UPDATE_ROLE: `${BASE_ROUTE}/update-role`,
    DELETE_ROLE: `${BASE_ROUTE}/delete-role`,
    ADD_ROLE_TO_USER: `${BASE_ROUTE}/add-role-to-user`,
    DELETE_ROLE_FOR_USER: `${BASE_ROUTE}/delete-role-for-user`,

	ADD_ROLE_PERMISSION: `${BASE_ROUTE}/add-role-permission`,
	DELETE_ROLE_PERMISSION: `${BASE_ROUTE}/delete-role-permission`,
	SEARCH_USER: `${BASE_ROUTE}/search-user`,
	DELETE_USER: `${BASE_ROUTE}/delete-user`,
	ADD_PERMISSION_DIRECTLY: `${BASE_ROUTE}/add-permission-directly`,

    ORIGIN_APP: BASE_ROUTE
}

exports.CF_ROUTINGS_ROLE = CF_ROUTINGS_ROLE;
