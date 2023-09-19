const BASE_ROUTE = '/account';
const BASE_AUTH_ROUTE = '/auth';

const CF_ROUTINGS_ACCOUNT = {
    // MANAGEMENT
	LIST_USER:          `${BASE_ROUTE}/list`,
	CREATE_USER:		`${BASE_ROUTE}/create`,
	INFO_USER:          `${BASE_ROUTE}/info`,
    UPDATE_USER:        `${BASE_ROUTE}/update`,
    DELETE_USER:        `${BASE_ROUTE}/delete`,

    UPDATA_AVATAR:      `${BASE_ROUTE}/update-avatar`,
    UPDATA_EMAIL:       `${BASE_ROUTE}/update-email`,
    UPDATA_PHONE:       `${BASE_ROUTE}/update-phone`,
    UPDATE_PASSWORD:	`${BASE_ROUTE}/update-password`,
    UPDATE_DEVICE:		`${BASE_ROUTE}/update-device`,

    // AUTH
	GENERATE_CODE_OTP:  `${BASE_AUTH_ROUTE}/generate-otp`,
	VERIFY_OTP:  		`${BASE_AUTH_ROUTE}/verify-otp`,

	REGISTER_NORMAL:    `${BASE_AUTH_ROUTE}/register-normal`,
	REGISTER_SOCIAL:    `${BASE_AUTH_ROUTE}/register-social`,

	LOGIN_NORMAL:       `${BASE_AUTH_ROUTE}/login-normal`,
	LOGIN_SOCIAL:       `${BASE_AUTH_ROUTE}/login-social`,
	LOGIN_OTP:       	`${BASE_AUTH_ROUTE}/login-otp`,
	FORGOT_PASSWORD:    `${BASE_AUTH_ROUTE}/forgot-password`,
}

exports.CF_ROUTINGS_ACCOUNT = CF_ROUTINGS_ACCOUNT;
