const redis = require("redis");

const REDIS_SEPERATOR = {
    HOST: process.env.REDIS_HOST || `127.0.0.1`,
    PORT: process.env.REDIS_PORT || `6379`,
    USR:  process.env.REDIS_USER || ``,
    PWD:  process.env.REDIS_PWD  || ``
}
exports.REDIS_SEPERATOR = REDIS_SEPERATOR;

exports.CLIENT_REDIS = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || '6379',
    auth_pass: process.env.REDIS_PWD  || ``
});