const BASE_ROUTE = '/admin';

const CF_ROUTINGS_CHART = {
    // MANAGEMENT
	GENERATE_CHART:      `${BASE_ROUTE}/generate-charts`,
	
	ADD_MANAGE_CHART:    `${BASE_ROUTE}/add-manage-chart`,

	GET_MANAGE_CHART:    `${BASE_ROUTE}/info-manage-chart`,
	GET_CHART:           `${BASE_ROUTE}/info-chart`,

}

exports.CF_ROUTINGS_CHART = CF_ROUTINGS_CHART;
