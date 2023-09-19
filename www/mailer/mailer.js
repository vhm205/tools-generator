"use strict";

let mailer = require("nodemailer");
let cfMailer = require('../config/cf_mailer');

module.exports = function ({ from, to, subject, content, attachments, callback }) {
    let smtpTransport = mailer.createTransport("SMTP", {
        service: cfMailer.service,
        auth: {
            user: cfMailer.email,
            pass: cfMailer.password,
        }
    });

    let mail = {
        from: from || 'EXT TRADE',
        to: to,
        subject: subject,
        html: content,
        attachments
    };

    smtpTransport.sendMail(mail, function (error, response) {
        if (error) {
            if (callback == null || typeof callback == "undefined") {
            } else {
                callback({ error: true, message: "Send mail error!" });
            }
        } else {
            if (callback == null || typeof callback == "undefined") {
            } else {
                callback({ error: false, message: "Send mail success!", data: response });
            }
        }

        smtpTransport.close();
    });
};