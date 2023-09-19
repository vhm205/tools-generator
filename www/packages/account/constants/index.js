/**
 * Loại tài khoản
 */
module.exports.ACCOUNT_TYPE = ['normal', 'facebook', 'google', 'apple'];

/**
 * Giới tính
 */
 module.exports.GENDER_TYPE = ['male', 'female', 'other'];

/**
 * Loại OTP
 * 1. đăng ký
 * 2. đăng nhập
 * 3. quên mật khẩu
 * 4. cập nhật số điện thoại
 */
module.exports.OTP_TYPE = [1,2,3,4];

// Chu kỳ 1 phút gửi OTP 1 lần
module.exports.MINUTE_FOR_COMPARE = 1;

// 5 phút chỉ 1 code được tạo ra (CHỜ quá trình người dân có thể đăng ký thông tin bên zalo)
module.exports.TIME_FOR_BORN_CODE = 1;
