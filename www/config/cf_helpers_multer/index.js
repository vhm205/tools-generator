let { upload }   = require('./config/cf_multer');
let uploadSingle = upload.single('file');
let uploadArray  = upload.array('files');
let uploadFields = upload.fields([{ name: 'images', maxCount: 5 }]);
let uploadFieldsAvatarGallery = upload.fields([
    { name: 'avatar', maxCount: 1 }, 
    { name: 'gallery', maxCount: 5 }
]);

module.exports = {
    uploadSingle,
    uploadArray,
    uploadFields,
    uploadFieldsAvatarGallery
}
