require('./module/prototype');

const { generateSchema } = require('./generate-schema');
const { generateModel }  = require('./generate-model');
const { generateApi }    = require('./generate-api');
const { generateView }   = require('./generate-view');

module.exports = {
    generateSchema,
    generateModel,
    generateApi,
    generateView
}
