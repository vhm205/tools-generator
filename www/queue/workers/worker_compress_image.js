require('dotenv').config();
const { parentPort }                    = require('worker_threads');
const sharp                             = require('sharp');
const fs                                = require('fs');
const path                              = require('path');
const uuidv4                            = require('uuid').v4;
const { domain }                        = require('../../config/cf_host');
const { getExtension }                  = require('../../utils/utils');
const { UPLOAD_FILE_S3 }                = require('../../packages/upload-s3/utils');
const IMAGE_COLL                        = require('../../packages/image/databases/image-coll');

const { AWS_S3_URI, AWS_S3_URI_SOURCE } = process.env;

async function compressImage(file, body, selfHost) {
    try {
        const extension      = getExtension(file.path);
        const fileName       = `${uuidv4()}-compress.${extension}`;
        const pathFileCompressed = path.join(__dirname, `../../../files/uploads/compressed/${fileName}`);

        let urlImage = '';

        const compress = await sharp(body)
            .webp({ quality: 60, progressive: true, force: false })
            .jpeg({ quality: 60, progressive: true, force: false })
            .png({ quality: 60, progressive: true, force: false })
            .toFile(pathFileCompressed);
 
        if(!selfHost){
            await UPLOAD_FILE_S3({ 
                pathBucket: 'root/compress',
                pathFile: pathFileCompressed,
                contentType: file.type,
                fileName
            });

            urlImage = `${AWS_S3_URI || AWS_S3_URI_SOURCE}${fileName}`;
        } else{
            urlImage = `${domain}files/uploads/compressed/${fileName}`;
        }

        await IMAGE_COLL.findByIdAndUpdate(file._id, {
            name: fileName,
            path: urlImage,
            nameBeforeCompress: file.name,
            pathBeforeCompress: file.path
        });

        return compress;
    } catch (error) {
        console.log('Error when compress: ')
        console.error(error)
        return file;
    }
}

function handleCompress(file, uploadPath, selfHost) {
    return new Promise(async resolve => {
        if(selfHost){
            const compressed = await compressImage(file, `${uploadPath}/${file.name}`, selfHost);
            return resolve(compressed);
        }

        const request = require('request').defaults({ encoding: null });

        request.get(file.path, async function(err, _, body) {
            if(err) return resolve(err);

            const compressed = await compressImage(file, body, selfHost);
            resolve(compressed);
        });
    })
}

parentPort.on('message', async params => {
    console.log(`WORKER THREAD: receive job from queue...`);

    try {
        const { imageID } = params;
        const uploadPath = path.join(__dirname, '../../../files/uploads/uncompressed');
        const uploadPathCompressed = path.join(__dirname, '../../../files/uploads/compressed');

        if(!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath);
        }

        if(!fs.existsSync(uploadPathCompressed)){
            fs.mkdirSync(uploadPathCompressed);
        }

        const infoImage = await IMAGE_COLL.findById(imageID);
        const infoAfterCompress = await handleCompress(infoImage, uploadPath, false);
        console.log({ infoAfterCompress, imageID: infoImage._id });

        parentPort.postMessage({ error: false, data: params });
    } catch (error) {
        console.error(error)
        parentPort.postMessage({ error: true, error });
    }
})
