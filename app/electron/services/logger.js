const electron = require('electron');
const winston = require('winston');

const path = require('path');
const WinstonDailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');


const appDataPath =  (electron.app || electron.remote.app).getPath('userData');

const awsService = require('./aws');
const BUCKETS = awsService.BUCKETS;


const runtimeFolder = path.join(appDataPath, '/runtime');

const logFileDirname = "logs";
const logFileDir = path.join(runtimeFolder, logFileDirname);
console.log("logFileDir -> ", logFileDir)
const levels = ['verbose', 'info', 'debug', 'error'];

fs.access(logFileDir, (err => {
    if (err){
        fs.mkdirSync(logFileDir, '0777');
    }
}));



const isLogEnabled = false;


const DailyRotateFileTransport = new (WinstonDailyRotateFile)({
    frequency: '24h',
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    prepend: true,
    handleExceptions: true,
    json: true,
    maxFiles: '14d',
    dirname: logFileDir,
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        DailyRotateFileTransport,
        new winston.transports.Console({
            level: 'verbose',
            handleExceptions: true,
            json: true,
            colorize: true
        })
    ],
    exitOnError: false
});


DailyRotateFileTransport.on('rotate', function (oldFilename, newFilename) {
    //TODO upload to server the old file
});


function list(callback) {
    fs.readdir(logFileDir, function (err, filenames) {
        if (err) {
            logger.error('Unable to scan directory: ' + err);
            return callback(err, null)
        }
        const files = filenames.filter(file => !file.startsWith('.')).reverse();
        callback(null, files);
    });
}

function send({username, logName}, callback) {
    const fileName = logFileDir + '/' + logName;
    fs.readFile(fileName, (err, buffer) => {
        if (err) {
            logger.error(`Unable to read file ${logName}: ${err}`);
            return callback(err, null)
        }

        const bucket = BUCKETS.LOGS;
        // const key = `desktop/${process.env.NODE_ENV}/${username}/${logName}`;
        const key = `desktop/${username}/${logName}`;

        awsService.object.put(bucket, key, buffer, (err, result) => {
            if (!err) {
                callback(null, logName);
            }
        });
    });
}

function remove(logName, callback) {
    const fileName = logFileDir + '/' + logName;
    fs.unlink(fileName, (err) => {
        if (err) {
            logger.error(`Unable to delete file ${logName}: ${err}`);
            return callback(err, null)
        }
        callback(null, logName)
    });
}

function flush(callback) {
    list((err, filenames) => {
        if (!err) {
            if (filenames.length === 0) {
                return callback("DIR_ALREADY_EMPTY", null);
            }
            filenames.forEach(filename => {
                remove(filename, (err, result) => {
                    if (!err) {
                        logger.info(result);
                    }
                })
            });
            callback(null, true)
        } else {
            callback("UNKNOWN_ERROR", null)
        }
    })
}


function log(level = 'verbose', message, meta = null, callback) {
    if (isLogEnabled) {
        if (typeof meta === 'function') {
            callback = meta;
        }
        if (levels.includes(level)) {
            return logger.log(level, message, meta);
        }
        typeof callback === "function" && callback("UNKNOWN_LOG_LEVEL", null);
    }
}

logger.methods = {
    list,
    send,
    remove,
    flush,
    log
};

module.exports = logger;
