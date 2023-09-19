const Os    			    = require('os');
const path  			    = require('path');
const AWS                   = require('aws-sdk');
const { StaticPool } 	    = require('node-worker-threads-pool');
const { config }            = require('../../packages/upload-s3/constants');
const number_threads 	    = Os.cpus().length;

AWS.config.update({
    accessKeyId: config.aws_access_key_id,
    secretAccessKey: config.aws_secret_access_key,
    region: config.aws_region,
});

const workerPoolCompress = new StaticPool({
    size: number_threads,
    task: path.resolve(__dirname, `./workers/worker_compress_image.js`),
    workerData: 'workerdata pass at MAIN',
});

class QueueManagement {
    constructor() {
        this.API_VERSION = '2012-11-05';
        this.QUEUE_COMPRESS_URL = process.env.QUEUE_COMPRESS_URL;

        this.SQS = new AWS.SQS({ apiVersion: this.API_VERSION });
    }

    initParams({ queueURL }){
        return {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 10,
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: queueURL,
            VisibilityTimeout: 20,
            WaitTimeSeconds: 0
        }
    }

    consumerCompressImage(){
        try {
            const params = this.initParams({ queueURL: this.QUEUE_COMPRESS_URL });

            this.SQS.receiveMessage(params, async (err, data) => {
                if (err) {
                    console.error({ ERROR_RECEIVE_MESSAGE_COMPRESS: err });
                }

                console.log({
                    'data.Messages': data?.Messages
                })

                if (data?.Messages) {
                    for (const message of data.Messages) {
                        const { ReceiptHandle, Body } = message;
                        const dataAfterParse = JSON.parse(Body);

                        workerPoolCompress.exec(dataAfterParse).then(result => {
                            console.log({ __then: result.data });
                            console.log('==================================================================');

                            if(result.error){
                                new Error('some unexpected error (job failed)', result);
                            }

                            const deleteParams = {
                                QueueUrl: this.QUEUE_COMPRESS_URL,
                                ReceiptHandle
                            };

                            this.SQS.deleteMessage(deleteParams, function(err, data) {
                                if (err) {
                                    console.log("Delete Error", err);
                                } else {
                                    console.log("Message Deleted", data);
                                }
                            });
                        });
                        // END WORKER POOL
                    }
                    // END FOR
                }
                // END IF
            });

        } catch (error) {
            console.error({ ERROR_PULL_QUEUE_COMPRESS: error });
        }
    }
}

const queue = new QueueManagement();

setInterval(() => {
    queue.consumerCompressImage();
}, 60 * 60);


process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
	console.log('Shutting down ...');
	process.exit(0);
}