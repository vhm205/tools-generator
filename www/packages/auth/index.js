const ROLE_BASE__MODEL 		= require('./models/role_base').MODEL;
const ROLE_BASE__COLL  		= require('./databases/role_base-coll');
const API_MANAGEMENT__MODEL	= require('./models/api_management').MODEL;

module.exports = {
    ROLE_BASE__COLL,
    ROLE_BASE__MODEL,
	API_MANAGEMENT__MODEL,
}
