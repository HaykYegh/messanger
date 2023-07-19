const AWS = require('aws-sdk');
const logger = require('./logger');
const appConfig = require("../../config.json").zz;

const s3 = new AWS.S3({
    accessKeyId: appConfig.S3.accessKeyId,
    secretAccessKey: appConfig.S3.secretAccessKey,
    region: appConfig.S3.region
});

const BUCKETS = {
    LOGS: appConfig.BUCKETS.logs,
    DESKTOP_RELEASES: appConfig.BUCKETS.desktopReleases,
};

function s3PutObject(bucket, key, body, callback) {
    s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: body
    }, (err) => {
        if (err) {
            logger.error(err);
            return callback(err, null);
        }
        callback(null, {bucket, key});
    });
}


module.exports = {
    object: {
        put: s3PutObject
    },
    BUCKETS
};
