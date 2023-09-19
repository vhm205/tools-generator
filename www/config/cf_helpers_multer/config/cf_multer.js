let multer                   = require('multer');
let path                     = require('path');
let { md5 }                  = require('../../../utils/string_utils');
let { MIME_TYPES_IMAGE }     = require('../../cf_constants');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let outputPath = path.resolve(__dirname, `../../../../files/`);
        cb(null, outputPath);
    },
    filename: function (req, file, cb) {
        let fileName = '';

        if(MIME_TYPES_IMAGE.includes(file.mimetype)){
            let newFileName = md5(`${file.originalname}_${Date.now()}`);
            fileName = `${newFileName}${path.extname(file.originalname)}`;
            cb(null, fileName);
        } else{
            fileName = `${file.originalname}`;
            cb(null, fileName);
        }

        req.fileName = fileName;
    }
})

exports.upload = multer({ storage: storage });
