let { config }  = require('../constants');
let AWS         = require('aws-sdk');
let fs          = require('fs');
let axios       = require('axios');

AWS.config.update({
    accessKeyId : config.aws_access_key_id,
    secretAccessKey : config.aws_secret_access_key,
    region: config.aws_region,
})
let s3Object = new AWS.S3();

// link từ s3 upload file
let render_link_upload_file_s3 = ({ fileName, type, pathBucket = 'root' }) =>{
    try {
        let bucket = `${config.bucket}/${pathBucket}`;

        let url = s3Object.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: fileName,
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        });

        // console.log({ url_sign: url })
        return { error: false, url };
    } catch (error) {
        return { error: true, message: 'cant_create_url' }
    }
}

function render_link_upload_s3(fileName, type, pathBucket) {
    return new Promise(async resolve => {
        try {
            if(!fileName || !type)
                return resolve({ error: true, message: "params_invalid" });

            let result = await render_link_upload_file_s3({ fileName, type, pathBucket });
            if(result.error)
                return resolve({ error: true, message: "Error" });

            return resolve({ error: false, data: result });
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })
}

const uploadFile = ({ pathFile, fileName, contentType = 'image/jpeg', pathBucket = 'root' }) => {
    return new Promise( resolve => {
        try {
            console.log({ pathFile, fileName, contentType, pathBucket })
            // Read content from the file
            // const fileContent = fs.readFileSync(pathFile);
            // console.log({ pathFile });
            let parseBase64ToBuffer = Buffer.from(pathFile.replace(/^data:image\/\w+;base64,/, ""),'base64');
            let bucket = `${config.bucket}/${pathBucket}`;

            // Setting up S3 upload parameters
            const params = {
                ContentEncoding: 'base64',
                ContentType: contentType,
                ACL: 'public-read',
                Bucket: bucket,
                Key: fileName,
                Body: parseBase64ToBuffer
            };

            // Uploading files to the bucket
            s3Object.upload(params, function(err, data) {
                if (err) {
                    console.log({ err });
                    throw err;
                }

                return resolve({ error: false, data: data });
            });
        } catch (error) {
            return resolve({ error: true, message: error.message })
        }
    })
    
};

const uploadFileToS3 = ({ pathFile, fileName, contentType = 'image/jpeg', pathBucket = 'root' }) => {
    return new Promise(async resolve => {
        try {
            let { data: { url } } = await render_link_upload_s3(fileName, contentType, pathBucket);

            fs.readFile(pathFile, (err, fileData) => {
                if(err) return resolve({ error: true, message: err.message });

                axios({
                    url,
                    method: 'put',
                    data: fileData,
                    headers: { 
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*',
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                })
                .then(() => resolve({ error: false, message: 'upload_success' }))
                .catch(err => resolve({ error: true, message: err.message }))
                // .then(() => fs.unlinkSync(`./uploads/${fileName}`))
            })
        } catch (error) {
            console.error(error)
            return resolve({ error: true, message: error.message })
        }
    })
    
};

exports.GENERATE_LINK_S3 = render_link_upload_s3;
exports.UPLOAD_FILE_S3   = uploadFileToS3;
