exports.CF_ROUTINGS_UPLOAD_S3 = {
    GENERATE_LINK_S3: '/generate-link-s3',
    UPLOAD_FILE_TO_S3: '/upload-file-to-s3',
}

exports.config = {
    aws_access_key_id       : process.env.AWS_ACCESS_KEY || "",
    aws_secret_access_key   : process.env.AWS_SECRET_KEY || "",
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "ldk-software.nandio",
    signedUrlExpireSeconds  : 60000
}
