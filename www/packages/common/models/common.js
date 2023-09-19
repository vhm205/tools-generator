"use strict";

/**
 * EXTERNAL PACKAGE
 */
const AWS               = require('aws-sdk');

/**
 * INTERNAL PACKAGE
 */
const BaseModel         = require('../../../models/intalize/base_model');
const { config }        = require('../../upload-s3/constants');


class Model extends BaseModel {
    constructor() {
        super();

        this.API_VERSION = '2012-11-05';
        this.QUEUE_COMPRESS_URL = process.env.QUEUE_COMPRESS_URL;

        this.SQS = new AWS.SQS({ apiVersion: this.API_VERSION });

        AWS.config.update({
            accessKeyId: config.aws_access_key_id,
            secretAccessKey: config.aws_secret_access_key,
            region: config.aws_region,
        });
    }

    initParams({ title, body, queueURL }){
        return {
            // Remove DelaySeconds parameter and value for FIFO queues
            DelaySeconds: 3,
            MessageAttributes: {
                "Title": {
                    DataType: "String",
                    StringValue: title
                },
                "Author": {
                    DataType: "String",
                    StringValue: "Smartlog"
                },
                "WeeksOn": {
                    DataType: "Number",
                    StringValue: "6"
                }
            },
            MessageBody: JSON.stringify(body),
            // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
            // MessageGroupId: "Group1",  // Required for FIFO queues
            QueueUrl: queueURL
        }
    }

    pushJobCompressImage({ imageID }) {
        return new Promise(async (resolve) => {
            try {
                // Create an SQS service object
                const params = this.initParams({
                    queueURL: this.QUEUE_COMPRESS_URL,
                    title: "Compress image files",
                    body: { imageID }
                });

                this.SQS.sendMessage(params, function(err, data) {
                    if (err) {
                        return resolve({ error: true, message: err.message });
                    }

                    console.log({ MESSSAGE: 'Push job success!!' });
                    resolve({ error: false, message: 'Push job success!!' });
                });
            } catch(error){
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
