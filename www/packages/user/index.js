const USER_MODEL 		   = require('./models/user').MODEL;
const USER_COLL  		   = require('./databases/user-coll');
const USER_ROUTES          = require('./apis/user');
const { CF_ROUTINGS_USER } = require('./constants/user.uri');

module.exports = {
    USER_ROUTES,
    USER_COLL,
    USER_MODEL,
    CF_ROUTINGS_USER
}
