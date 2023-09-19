const ACCOUNT_MODEL             = require('./models/account').MODEL;
const ACCOUNT_COLL              = require('./databases/account/account-coll');
const ACCOUNT_ROUTES            = require('./apis/account');
const { CF_ROUTINGS_ACCOUNT }   = require('./constants/account.uri');

const OTP_COLL                  = require('./databases/otp/otp-coll');
const OTP_AUTHY_COLL            = require('./databases/otp/otp_authy-coll');
const OTP_MODEL                 = require('./models/otp').MODEL;

module.exports = {
    ACCOUNT_ROUTES,
    ACCOUNT_COLL,
    ACCOUNT_MODEL,

    OTP_COLL,
    OTP_AUTHY_COLL,
    OTP_MODEL,

    CF_ROUTINGS_ACCOUNT
}