"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                            = require('mongoose').Types.ObjectId;

/**
 * INTERNAL PACKAGE
 */
const BaseModel                           = require('../../../models/intalize/base_model');
const IMAGE_COLL                          = require('../databases/image-coll');

/**
 * MODEL
 */
const COMMON_MODEL                        = require('../../common/models/common').MODEL;


class Model extends BaseModel {
    constructor() {
        super(IMAGE_COLL);
    }

    insert({ name, size, type, path, userCreate, isCompress = false }) {
        return new Promise(async (resolve) => {
            try {
                let resultInsert = await this.insertData({ name, size, type, path, userCreate });
                if(!resultInsert)
                    return resolve({ error: true, message: 'params_invalid' });

                if(isCompress){
                    // Push queue to compress image
                    await COMMON_MODEL.pushJobCompressImage({
                        imageID: resultInsert._id,
                    })
                }

                return resolve({ error: false, data: resultInsert });
            } catch(error){
                return resolve({ error: true, message: error.message });
            }
        })
    }

    delete({ imageID }) {
        return new Promise(async resolve => {
            try {
                if(!ObjectID.isValid(imageID))
                    return resolve({ error: true, message: "param_not_valid" });

                const infoAfterDelete = await IMAGE_COLL.findByIdAndDelete(imageID);

                if(!infoAfterDelete) 
                    return resolve({ error: true, message: "image_is_not_exists" });

                return resolve({ error: false, data: infoAfterDelete });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

module.exports.MODEL = new Model;
