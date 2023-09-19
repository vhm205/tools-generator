"use strict";

module.exports = {
    supportMail: "noreply.ldksoftware@gmail.com",

    email: process.env.MAILER_SENDER,
    pass:  process.env.MAILER_PWD,
    siteName: process.env.STAGING_DOMAIN || 'https://ldksoftware.com/',
    password: process.env.MAILER_PWD,

    host: process.env.MAILER_HOST || 'smtp.gmail.com',
    port: process.env.MAILER_PORT || '587',
    service: 'Gmail',
};
