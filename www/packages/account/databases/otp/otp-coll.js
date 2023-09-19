"use strict";

const BASE_COLL = require('../../../../database/intalize/base-coll');

module.exports = BASE_COLL('otp', {
    userZaloID: String, 
    phone: String,
    email: String,
    /**
     * 1. đăng ký
     * 2. đăng nhập
     * 3. quên mật khẩu
     * 4. cập nhật sdt
     */
    type: Number,
    // mã otp sinh ra 6 số
    code: String,
    /**
     * 0. chưa verify (mặc định)
     * 1. đã verify thành công
     * 2. đã hết hạn (người dùng tạo mã mới trên sdt đó)
     */
    status: {
        type: Number,
        default: 0
    },
    /**
     * khi tạo mã code, hệ thống tự tính expiredTime để xác định tính hợp lệ code
     */
    expiredTime: Date,
    /**
     *  trạng thái tin nhắn được gửi đi hay chưa
     * 1/ đã gửi đi
     * 2/ chưa gửi đi được (lỗi)
     * sau này bổ sung: chưa xem, đã xem nhờ webhook
     */
    deliveryOTP: {
        type: Number
    }
});
