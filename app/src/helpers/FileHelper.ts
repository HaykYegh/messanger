"use strict";

import {AUDIO_MIME_TYPE, IMAGE_MIME_TYPE, MESSAGE_TYPES, sizeInfo, VIDEO_MIME_TYPE} from "configs/constants";
import {showLoading, updateMessageProperty} from "modules/messages/MessagesActions";
import storeCreator from "helpers/StoreHelper";
import conf from "configs/configurations";
import * as mime from "mime-types";
import {Store} from "react-redux";
import format from "date-fns/format";
import {v4 as uuid} from "uuid";
import axios, {AxiosResponse} from "axios";
import {generateSignedUrl, getSignedUrl} from "requests/fsRequest";
import {ImageManager} from "helpers/ImageHelper";
import {IDownloadFile, IUploadFile} from "services/interfaces";
const fs = require('fs');
const os = require("os");
const {DOWNLOAD_FOLDER_NAME} = require("../../../app/config.json").zz;
import MessagesModel from "modules/messages/MessagesModel";
import Log from "modules/messages/Log";
import {types} from "helpers/DataHelper";
import IDBMessage from "services/database/class/Message";


// Validated by team

export async function attemptUploadFile(file: IUploadFile) {
    const signedUrl: string = await generateSignedUrl(file.bucket, 'PUT', file.key);
    const upload: AxiosResponse = await axios.put(signedUrl, file.data);
    if (upload.status === 200) {
        return {uploaded: true}
    }
    return null;
}

export async function attemptRetrieveFile(file: IDownloadFile) {
    const signedUrl: string = await generateSignedUrl(file.bucket, 'GET', file.key);
    const download: any = await fetch(signedUrl);
    const blob: Blob = await download.blob();
    return blob && blob.type !== "application/xml" ? blob : null;
}

// end


let lastDateMsg = 0;
let lastDateRel = 0;

export async function sendFile(file: File, username: string, groupId: string | boolean, sendThumb: any, caption?: string): Promise<any> {
    let msgIdTime: number = Date.now();
    let msgId = `msgId${msgIdTime}`;
    if (lastDateMsg !== msgIdTime) {
        lastDateMsg = msgIdTime;
    } else {
        msgIdTime += 10;
        msgId = `msgId${msgIdTime}`;
        lastDateMsg = msgIdTime;
    }
    const index: number = file.name.lastIndexOf(".");

    let fileName: string;
    let fileType: string;

    if (index !== -1) {
        [fileName, fileType] = [file.name.slice(0, index), file.name.slice(index + 1)];
    } else {
        fileName = file.name;
        fileType = mime.extension(file.type);
    }

    const awsLink: string = groupId ? `${groupId}/${username}/${msgId}` : `${username}/${msgId}`;

    let msgType: string = file.type.split("/").shift();
    let msgInfo: any;
    let rel: string;
    let relTime: number;

    if (file.type === "audio/webm") {
        msgType = "voice";
    }

    if ([IMAGE_MIME_TYPE, VIDEO_MIME_TYPE].includes(msgType)) {
        msgType = msgType.toUpperCase();
        msgInfo = await getThumbnail(file, 0.8);
        relTime = Date.now();
        rel = `msgId${relTime}`;
        if (lastDateRel !== relTime) {
            lastDateRel = relTime;
        } else {
            relTime += 10;
            rel = `msgId${msgIdTime}`;
            lastDateRel = relTime;
        }
        sendThumb(file, rel, msgId, msgInfo.img || msgInfo, awsLink, MESSAGE_TYPES.image === msgType, caption);
    } else if (msgType === AUDIO_MIME_TYPE) {
        msgType = msgType.toUpperCase();
        msgInfo = "";
    } else {
        msgType = "FILE";
        msgInfo = JSON.stringify({
            fileSize: file.size,
            fileName,
            fileType
        });
    }

    try {
        await setAWSFiles([{
            bucket: groupId ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer,
            path: awsLink,
            value: file
        }]);
    } catch (error) {
        console.dir(error);
        return false;
    }
    return {
        awsId: groupId ? groupId + "/" + encodeURIComponent(username) + "/" + msgId : encodeURIComponent(username) + "/" + msgId,
        awsIdToSave: awsLink,
        msgInfo,
        msgId,
        msgType,
        rel
    };
}

export async function uploadToAWS(file: File, username: string, groupId: string | boolean, caption?: string): Promise<any> {

    let msgIdTime: number = Date.now();
    let msgId = `msgId${msgIdTime}`;
    if (lastDateMsg !== msgIdTime) {
        lastDateMsg = msgIdTime;
    } else {
        msgIdTime += 10;
        msgId = `msgId${msgIdTime}`;
        lastDateMsg = msgIdTime;
    }
    const index: number = file.name.lastIndexOf(".");

    let fileName: string;
    let fileType: string;

    if (index !== -1) {
        [fileName, fileType] = [file.name.slice(0, index), file.name.slice(index + 1)];
    } else {
        fileName = file.name;
        fileType = mime.extension(file.type);
    }
    const fileRemotePath: string = groupId ? `${groupId}/${username}/${msgId}` : `${username}/${msgId}`;
    const currentBucket: any = groupId ? conf.app.aws.bucket.group : conf.app.aws.bucket.fileTransfer;

    let msgType: string = file.type.split("/").shift();
    let msgInfo: string;
    let rel: string;
    let relTime: number;

    if (file.type === "audio/webm") {
        msgType = "voice";
    }

    if ([IMAGE_MIME_TYPE, VIDEO_MIME_TYPE].includes(msgType)) {
        const isVideo = VIDEO_MIME_TYPE === msgType;

        msgType = msgType.toUpperCase();

        msgInfo = await getThumbnail(file, isVideo);

        relTime = Date.now();
        rel = `msgId${relTime}`;
        if (lastDateRel !== relTime) {
            lastDateRel = relTime;
        } else {
            relTime += 10;
            rel = `msgId${msgIdTime}`;
            lastDateRel = relTime;
        }
    } else if (msgType === AUDIO_MIME_TYPE) {
        msgType = msgType.toUpperCase();
        msgInfo = "";
    } else {
        msgType = "FILE";
        msgInfo = JSON.stringify({
            fileSize: file.size,
            fileName,
            fileType
        });
    }

    try {
        await setAWSFiles([{
            bucket: currentBucket,
            path: fileRemotePath,
            value: file
        }]);
    } catch (error) {
        console.log(error);
        return false;
    }
    return {
        fileRemotePath,
        msgInfo,
        msgId,
        msgType,
        rel
    };
}

export function imageToFile(url: string, name: string, type: string, callback: (file: File) => void): any {
    const img: HTMLImageElement = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        let canvas: HTMLCanvasElement = document.createElement("CANVAS") as HTMLCanvasElement;
        const ctx: any = canvas.getContext("2d");
        let dataURL: string;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        dataURL = canvas.toDataURL();
        callback(base64ToFile(dataURL, name, type));
        canvas = null;
    };
    img.src = `${url}&crossorigin`;
}

// export async function uploadFile(key: string, file: any, bucket: string, msgId: string = null): Promise<any> {
//     const store: Store<any> = storeCreator.getStore();
//     const dispatch: any = store.dispatch;
//
//     const getSignedUrlParams: any = {
//         bucket: "zangifiletransfer",
//         method: "PUT",
//         path: key,
//         contentType: file.type
//     };
//
//     const signedUrl = await  getSignedUrl(getSignedUrlParams);
//     const awsUploadUrl: any = signedUrl.data.body;
//     const formData: any = new FormData();
//
//     // const fileData: any = await readAsArrayBuffer(file);
//
//
//
//     formData.append("file", file);
//
//     return new Promise((resolve, reject) => {
//         const xhr: XMLHttpRequest = new XMLHttpRequest();
//
//         if (!signedUrl) {
//             reject("Signed url is missing");
//         }
//
//         xhr.upload.addEventListener("progress", evt => {
//
//             if (evt.lengthComputable) {
//                 const percentComplete: number = Math.round(evt.loaded * 100 / evt.total);
//                 dispatch(showLoading(percentComplete, msgId, true));
//             } else {
//                 console.dir("unable to compute");
//             }
//
//         }, false);
//
//         xhr.addEventListener("load", resp => {
//             dispatch(showLoading(100, msgId, true));
//             dispatch(showLoading(100, msgId, false));
//             resolve({Key: key, resp});
//         }, false);
//
//         xhr.addEventListener("error", evt => {
//             console.dir("There was an error attempting to upload the file." + evt);
//             reject(evt);
//         }, false);
//
//         xhr.addEventListener("abort", evt => {
//             console.dir("The upload has been canceled by the user or the browser dropped the connection." + evt);
//             reject(evt);
//         }, false);
//
//         xhr.open(getSignedUrlParams.method, awsUploadUrl, true);
//         xhr.send(formData);
//     });
// }

// export async function uploadProfile(key: string, file: any, bucket: string, msgId: string = null): Promise<any> {
//     const store: Store<any> = storeCreator.getStore();
//     const dispatch: any = store.dispatch;
//
//
//     const getSignedUrlParams: any = {
//         bucket: "zangiprofile",
//         method: "PUT",
//         path: key
//     };
//
//
//     return getSignedUrl(getSignedUrlParams).then(({data: {status, body}}) => {
//
//         const awsUploadUrl: any = body;
//         const formData: any = new FormData();
//
//         formData.append("file", file);
//
//
//         return new Promise((resolve, reject) => {
//             const xhr: XMLHttpRequest = new XMLHttpRequest();
//
//             if (status !== "SUCCESS") {
//                 reject("Signed url is missing");
//             }
//
//             xhr.upload.addEventListener("progress", evt => {
//
//                 if (evt.lengthComputable) {
//                     const percentComplete: number = Math.round(evt.loaded * 100 / evt.total);
//                     dispatch(showLoading(percentComplete, msgId, true));
//                 } else {
//                     console.dir("unable to compute");
//                 }
//
//             }, false);
//
//             xhr.addEventListener("load", resp => {
//                 dispatch(showLoading(100, msgId, true));
//                 dispatch(showLoading(100, msgId, false));
//                 resolve({Key: key, resp});
//             }, false);
//
//             xhr.addEventListener("error", evt => {
//                 console.dir("There was an error attempting to upload the file." + evt);
//                 reject(evt);
//             }, false);
//
//             xhr.addEventListener("abort", evt => {
//                 console.dir("The upload has been canceled by the user or the browser dropped the connection." + evt);
//                 reject(evt);
//             }, false);
//
//             xhr.open(getSignedUrlParams.method, awsUploadUrl, true);
//             xhr.send(formData);
//
//         });
//     });
// }

export async function uploadFile(key: string, file: any, bucket: string, msgId: string = null): Promise<any> {

    return setAWSFiles([{bucket, path: key, value: file}]);
}

export function uploadProfile(key: string, file: any, bucket: string, msgId: string = null): Promise<any> {
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;

    return fetchTheSignature(bucket, true).then(({signature, policy64FromServer, isoDate}) => {
        const shortDate: string = format(new Date(), "YYYY/MM/DD");
        const formData: any = new FormData();
        formData.append("acl", "private");
        formData.append("bucket", bucket);
        formData.append("key", key);
        formData.append("X-Amz-Credential", `${conf.app.aws.key}/${shortDate}/us-east-1/s3/aws4_request`);
        formData.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
        formData.append("Policy", policy64FromServer);
        formData.append("X-Amz-Signature", signature);
        formData.append("X-Amz-Date", isoDate);
        formData.append("file", file);

        return new Promise((resolve, reject) => {
            const xhr: XMLHttpRequest = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", evt => {

                if (evt.lengthComputable) {
                    const percentComplete: number = Math.round(evt.loaded * 100 / evt.total);
                    dispatch(showLoading(percentComplete, msgId, true));
                } else {
                    console.dir("unable to compute");
                }

            }, false);

            xhr.addEventListener("load", resp => {
                dispatch(showLoading(100, msgId, true));
                dispatch(showLoading(100, msgId, false));
                resolve({Key: key, resp});
            }, false);

            xhr.addEventListener("error", evt => {
                console.dir("There was an error attempting to upload the file." + evt);
                reject(evt);
            }, false);

            xhr.addEventListener("abort", evt => {
                console.dir("The upload has been canceled by the user or the browser dropped the connection." + evt);
                reject(evt);
            }, false);

            xhr.open("POST", `https://${bucket}.s3.amazonaws.com/`, true);
            xhr.send(formData);
        });
    });
}

export function base64ToFile(dataurl: string | Blob, filename: string, type?: string): File {
    if (dataurl instanceof Blob) {
        return new File([dataurl], filename, {type: type || dataurl.type});
    }
    const arr: Array<string> = dataurl.split(",");
    const mime: any = type || arr[0].match(/:(.*?);/)[1];
    const bstr: string = atob(arr[1]);
    let n: number = bstr.length;
    const u8arr: Uint8Array = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
}

export function getPublicUrl(uri: string, bucket: string): Promise<any> {

    const formData: FormData = new FormData();
    formData.append("bucket", bucket);
    formData.append("uri", uri);

    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.addEventListener("load", (evt: any) => {
            resolve(evt.target.responseText);
        }, false);

        xhr.addEventListener("error", evt => {
            console.dir("There was an error attempting to get puplic URL." + evt);
            reject(evt);
        }, false);

        xhr.open("POST", conf.api.v3.fs.url, true);
        xhr.send(formData);
    });
}

export function fetchTheSignature(bucket: string, profile: boolean = false): Promise<any> {
    const shortDate: string = format(new Date(), "YYYY/MM/DD");
    const formData: FormData = new FormData();
    formData.append("date", shortDate);
    formData.append("bucket", bucket);

    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open("POST", profile ? conf.api.v3.fs.updateProfile : conf.api.v3.fs.fileTransfer, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhr.onload = () => {
            if (xhr.status === 200) {
                const responseItems: Array<any> = xhr.response.split("_pol_");
                const signature: string = responseItems[0];
                const policy64FromServer: string = responseItems[1];
                const isoDate: string = responseItems[2];
                resolve({signature, policy64FromServer, isoDate});
            } else {
                const error: any = new Error(xhr.statusText);
                error.code = xhr.status;
                reject(error);
            }
        };

        xhr.send(formData);
    });
}

export function downloadFile(name: string, url: string): void {
    const a: HTMLAnchorElement = document.createElement("a");
    a.download = name;
    a.href = url;
    a.click();
}

export function urlToBase64(url: string): Promise<any> {
    return new Promise(resolve => {
        fetch(url).then(data => {
            data.blob().then((blob: any) => {
                const reader: FileReader = new FileReader();
                reader.addEventListener("loadend", () => {
                    resolve(reader.result.toString());
                });
                reader.readAsDataURL(blob);
            });
        });
    });
}

export function urlToBlob(url: string) {
    return fetch(url)
        .then(data => data.blob())
        .then(blob => blobToBase64(blob))
}

export function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader: FileReader = new FileReader();
        reader.addEventListener("loadend", () => {
            resolve(reader.result.toString());
        });
        reader.readAsDataURL(blob);
    })
}

export function handleFileDownload(fileMessage: any) {
    let fileType: string;
    switch (fileMessage.get("type")) {
        case MESSAGE_TYPES.file:
            fileType = JSON.parse(fileMessage.get("info")).fileType;
            break;
        case MESSAGE_TYPES.image:
            fileType = "jpg";
            break;
        case MESSAGE_TYPES.stream_file:
        case MESSAGE_TYPES.video:
            fileType = "mp4";
            break;
        case MESSAGE_TYPES.voice:
            fileType = "mp3";
            break;
        default:
            fileType = "";
            break;
    }
    if (["jpg"].includes(fileType)) {
        const link: HTMLAnchorElement = document.createElement("a");
        link.href = fileMessage.get("fileLink");
        link.download = uuid() + "." + fileType;
        link.click();
    } else {

        const info: any = JSON.parse(fileMessage.get("info"));

        let fileName;
        try {
            fileName = info.fileName + "." + info.fileType;
        } catch (e) {
            console.log('is not valid json string', e);
        } finally {
            fileName = !fileName || fileName.includes('undefined') ? uuid() + "." + info.fileType : fileName;
        }

        downloadFromUrlWithName(fileName, fileMessage.get("fileLink"), fileMessage.get("messageId"));
    }
}

export function downloadFromUrlWithName(name, url, msgId) {
    downloadFile(name, url);
}

function httpGet(url, msgId) {
    const store: Store<any> = storeCreator.getStore();
    const dispatch: any = store.dispatch;

    return new Promise(function (resolve, reject) {

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "arraybuffer";
        xhr.onprogress = function (event) {
            if (event.lengthComputable) {
                const percentComplete: number = Math.round(event.loaded * 100 / event.total);
                dispatch(showLoading(percentComplete, msgId, true));
            } else {
                console.dir("unable to compute");
            }
            console.log(event);
        };
        xhr.onload = function () {
            if (this.status == 200) {
                dispatch(showLoading(100, msgId, true));
                dispatch(showLoading(100, msgId, false));
                resolve(this.response);
            } else {
                const error = new Error(this.statusText);
                reject(error);
            }
        };

        xhr.onerror = function () {
            reject(new Error("Network Error"));
        };

        xhr.send();
    });

}

export function fileExist(url: string): any {
    return axios.get(url).then(() => {
        return true;
    }).catch(() => {
        return false;
    });
}

export function fileToBlob(url: string, type: any): any {
    return new Promise(function (resolve, reject) {
        if (!url) {
            return reject("invalid url");
        }
        if (!type) {
            return reject("invalid type");
        }
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
            const arrayBufferView = new Uint8Array(xhr.response);
            const blob: Blob = new Blob([arrayBufferView], {type});
            resolve(blob);
        };
        xhr.send();
    });
}

export function getBlobUri(file: Blob) {
    if (file instanceof Blob) {
        const urlCreator = (window as any).URL || (window as any).webkitURL;
        return urlCreator.createObjectURL(file, {autoRevoke: false});
    }
    return null;
}

export async function getImage(canvas, width, height, mime) {
    return new Promise(resolve => {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = width;
        tmpCanvas.height = height;

        const scale = Math.max((tmpCanvas.width / canvas.width), (tmpCanvas.height / canvas.height));

        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width * scale,
            canvas.height * scale,
        );

        tmpCanvas.toBlob(resolve, mime);
    });
}

export function handleFileSize(size) {

    let l = 0, n = parseInt(size, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + sizeInfo[l]);
}

export function getFileDetails(file) {
    return {
        name: file && file.file && file.file.name,
        size: file && file.file && handleFileSize(file.file.size),
        type: file && file.file && file.file.name && file.file.name.substring(file.file.name.lastIndexOf('.') + 1)
    };
}

export function getFileColor(type) {
    let className: string;
    switch (type) {
        case "pdf":
            className = 'file-bg-pdf';
            break;
        case "txt":
            className = 'file-bg-txt';
            break;
        case "doc":
            className = 'file-bg-doc';
            break;
        case "rtf":
            className = 'file-bg-rtf';
            break;
        case "csv":
            className = 'file-bg-csv';
            break;
        case "ppt":
            className = 'file-bg-ppt';
            break;
        case "xls":
            className = 'file-bg-xls';
            break;
        case "zip":
            className = 'file-bg-zip';
            break;
        case "jpeg":
        case "jpg":
        case "png":
            className = 'file-bg-jpeg';
            break;
        default:
            className = '';
    }
    return className;
}

export async function setAWSFiles(files: Array<any>): Promise<any> {
    const signedURLs: Array<any> = [];
    const uploadRequest: Array<any> = [];
    const requestURLs: Array<any> = [];

    files.map((file) => {
        signedURLs.push(getSignedUrl(file.bucket, 'PUT', file.path));
        requestURLs.push({bucket: file.bucket, path: file.path, value: file.value})
    });


    const signedURLsResult: Array<any> = await Promise.all(signedURLs);

    signedURLsResult.map((url, index) => {
        uploadRequest.push(axios.put(url, requestURLs[index].value));
    });

    return Promise.all(uploadRequest).catch(x => {
        return null
    });
}


export const getFileMetaData = (file: File) => {

    let fileName: string;
    let fileExtension: string;
    let fileType: string;
    let fileSize: number;

    const index: number = file.name.lastIndexOf(".");
    if (index !== -1) {
        [fileName, fileExtension] = [file.name.slice(0, index), file.name.slice(index + 1)];
    } else {
        fileName = file.name;
        fileExtension = mime.extension(file.type);
    }

    fileType = file.type.split("/").shift();
    fileSize = file.size;

    return {
        name: fileName,
        extension: fileExtension,
        size: fileSize,
        type: fileType,
        mime: file.type
    }
};

const resizeMe = (img) =>  {
    const max_width = 400;
    const max_height = 400;
    var canvas = document.createElement('canvas');

    var width = img.width;
    var height = img.height;

    // calculate the width and height, constraining the proportions
    if (width > height) {
        if (width > max_width) {
            //height *= max_width / width;
            height = Math.round(height *= max_width / width);
            width = max_width;
        }
    } else {
        if (height > max_height) {
            //width *= max_height / height;
            width = Math.round(width *= max_height / height);
            height = max_height;
        }
    }

    // resize the canvas and draw the image data into it
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    // preview.appendChild(canvas); // do the actual resized preview
    return canvas.toDataURL("image/jpeg",1); // get the data from canvas as 70% JPG (can be also PNG, etc.)

};

export const makeMacThumb = async (resized, msgId) => {
    try {
        const homeDir = os.homedir();
        const path = `${homeDir}/Library/Application Support/Electron`;
        const path2 = `${homeDir}/Library/Application Support/Electron/thumbs`;
        if (fs.existsSync(path)) {
            if (fs.existsSync(path2)) {
                await fs.writeFileSync(`${path2}/${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"));
            } else {
                await fs.mkDirByPathSync(path2);
                await fs.writeFileSync(`${path2}/${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"));
            }
        } else {
            await fs.mkdirSync(path);
            await fs.mkdirSync(path2);
            await fs.writeFileSync(`${path2}/${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"));
        }
    } catch(e) {
        console.log("thumbnail_path_error",e)
    }

};

export const makeWindowsThumb = async (resized,msgId) => {
    const homeDir = os.homedir();
    const path = `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}`
    const path2 = `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs`;
    if (fs.existsSync(path)) {
        if (fs.existsSync(path2)) {
            await fs.writeFile(`${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"))
        } else {
            await fs.mkDirByPathSync(path2);
            await fs.writeFile(`${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"))
        }
    } else {
        await fs.mkdirSync(path);
        await fs.mkdirSync(path2);
        await fs.writeFile(`${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`, resized, 'base64', () => console.log("file saved"))
    }
};

export const createThumbnail = async (msgId, image) => {
    const homeDir = os.homedir();
    const blobUri = getBlobUri(image);
    const iamj: HTMLImageElement = new Image();
    iamj.src = blobUri;
    const path = (window as any).isMac ? `${homeDir}/Library/Application Support/Electron/thumbs/${msgId}.jpeg` : (window as any).isWin ? `${homeDir}\\AppData\\Roaming\\${DOWNLOAD_FOLDER_NAME}\\thumbs\\${msgId}.jpeg`: '';
    iamj.onload = async () => {
        if(iamj.src) {

            const resized = await resizeMe(iamj).split(",").pop();
            (window as any).isMac ? await  makeMacThumb(resized,msgId) : (window as any).isWin ? await makeWindowsThumb(resized,msgId):'';
        }

    }
}

export const getThumbnail: any = (file: File | string | any, isVideo: boolean = false, keepOriginal: boolean = false, record: boolean = false) => {
    return new Promise((resolve) => {
        if (isVideo) {
            //File can be also the src
            const video: HTMLVideoElement = document.createElement("video");


            if (typeof file === "string") {
                video.src = file;
            } else {
                const bloburi = URL.createObjectURL(file);
                video.src = bloburi;
            }
            if ((window as any).isDesktop && (typeof file === "string" || (file as any).path)) {
                (window as any).ffmpeg.ffprobe((file as any).path || file, async (err, metadata) => {
                    if (!metadata) {
                        resolve(getEmptyThumbnail());
                        return;
                    }
                    const videoIndex = metadata.streams.findIndex(item => item.codec_type === "video");
                    if (videoIndex > -1 && metadata.streams[videoIndex].height && metadata.streams[videoIndex].width) {
                        const metadataInfo = metadata.streams[videoIndex];
                        const rotated = (metadataInfo.rotation && (metadataInfo.rotation === "-90" || metadataInfo.rotation === "-270" || metadataInfo.rotation === "90" || metadataInfo.rotation === "270"))
                        const height = rotated ? metadataInfo.width : metadataInfo.height;
                        const width = rotated ? metadataInfo.height : metadataInfo.width;

                        const optimalSize = ImageManager.optimalSize({
                            toSaveWidth: 300,
                            toSaveHeight: 300,
                            maxWidth: 350,
                            maxHeight: 400,
                            originalWidth: width,
                            originalHeight: height,
                            video
                        })

                        const saveHeight = optimalSize.height;
                        const saveWidth = optimalSize.width;

                        const fileName = new Date().getTime();
                        const command = (window as any).ffmpeg((file as any).path || file).screenshots({
                            timestamps: ['0'],
                            filename: `${fileName}.png`,
                            folder: (window as any).remote.process.cwd(),
                            size: `${saveWidth}x${saveHeight}`
                        })
                            .on('error', function (err) {
                                // resolve(getEmptyThumbnail());
                                resolve({url: getEmptyThumbnail(), saveWidth, saveHeight});
                            })
                            .on('end', async () => {
                                let fileSeparator = "/";
                                if ((window as any).isWin) {
                                    fileSeparator = "\\";
                                }
                                const fileLink = `${(window as any).remote.process.cwd()}${fileSeparator}${fileName}.png`;
                                const fileBlob = await MessagesModel.get('', fileLink);
                                /*const canvas: HTMLCanvasElement = document.createElement("canvas");
                                const ctx = canvas.getContext("2d");
                                canvas.width = saveWidth;
                                canvas.height = saveHeight;
                                ctx.imageSmoothingEnabled = true;
                                (ctx as any).imageSmoothingQuality = 'high';
                                const image: HTMLImageElement = document.createElement("img");
                                image.src = URL.createObjectURL(file);
                                image.onload = () => {
                                    ctx.drawImage(image, 0,0, canvas.width, canvas.height);
                                    //ctx.drawImage(video, (video.videoWidth - video.videoWidth * widthRatio) / 2, (video.videoHeight - video.videoHeight * heightRatio) / 2, video.videoWidth * widthRatio, video.videoHeight * heightRatio, 0, 0, canvas.width, canvas.height);
                                    resolve(canvas.toDataURL('image/jpeg').split(",").pop());
                                    (window as any).fs.unlink(fileLink, function(error) {
                                        if (error) {console.log("Error during unliniking file")}
                                    });
                                }*/

                                if (!fileBlob) {
                                    // return
                                    resolve(getEmptyThumbnail());
                                    // await fs.writeFileSync(file.path.replace("mp4", "jpg"), file.path);
                                } else {
                                    ImageManager.resize(fileBlob, {
                                        width: saveWidth,
                                        height: saveHeight,
                                        isFlex: true,
                                    }, (blob, obj) => {
                                        blobToBase64(blob).then((data: string) => {
                                            resolve({url: data.split(",").pop(), saveWidth, saveHeight, fileLink});
                                        })
                                    })
                                }
                            });
                    } else {
                        resolve(getEmptyThumbnail());
                    }
                })
            }

            // else if (typeof file !== "string" && !video.canPlayType(file.type)) {
            //     Log.i("getThumbnail -> 9", file)
            //     resolve(getEmptyThumbnail());
            // }

            if (!(file as any).path && record) {

                console.dir(video)
                video.addEventListener('loadedmetadata', () => {
                    // seek to user defined timestamp (in seconds) if possible

                    if (video.duration < 0.0) {
                        return;
                    }
                    // delay seeking or else 'seeked' event won't fire on Safari
                    setTimeout(() => {
                        video.currentTime = 0.0;
                    }, 200);
                    // extract video thumbnail once seeking is complete


                    video.addEventListener('seeked', () => {
                        // define a canvas to have the same dimension as the video
                        const canvas = document.createElement("canvas");
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        // draw the video frame to canvas

                        const optimalSize = ImageManager.optimalSize({
                            toSaveWidth: 300,
                            toSaveHeight: 300,
                            maxWidth: 350,
                            maxHeight: 400,
                            originalWidth: canvas.width,
                            originalHeight: canvas.height,
                            video
                        })

                        const toSaveWidth = optimalSize.width;
                        const toSaveHeight = optimalSize.height;

                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        resolve({url: ctx.canvas.toDataURL('image/jpeg', 0.8).split(",").pop(), toSaveWidth, toSaveHeight })

                    });
                });

                // });


            }

        } else {


            typeof file !== "string" && ImageManager.resize(file, {
                width: 420,
                height: 420,
                isFlex: true,
                keepOriginal: keepOriginal,
            }, (blob, dimensions) => {
                const optimalSize = ImageManager.optimalSize({
                    toSaveWidth: 300,
                    toSaveHeight: 300,
                    maxWidth: 350,
                    maxHeight: 400,
                    originalWidth: dimensions.width,
                    originalHeight: dimensions.height,
                    video: false
                })
                dimensions.width = optimalSize.width;
                dimensions.height = optimalSize.height;
                blobToBase64(blob).then((data: string) => {
                    resolve({img: data.split(",").pop(), dimensions: dimensions});
                })
            });
        }
    })
};

export const getEmptyThumbnail = () => {
    return "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAD6APoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k=";
}

export const getAudioMeta = (fileUrl: string) => {
    return new Promise((resolve, reject) => {
        try {
            const audio: HTMLAudioElement = new Audio(fileUrl);

            audio.addEventListener('loadedmetadata', function () {
                let duration: number = this.duration;
                let elem = this;
                if (this.duration !== this.duration) {
                    resolve(null);
                }
                if (this.duration === Infinity) {
                    this.currentTime = 1e101;
                    this.ontimeupdate = function () {
                        elem.currentTime = 0.001;
                        duration = elem.duration;
                        elem.ontimeupdate = null;
                        resolve({
                            duration
                        })
                    }
                } else {
                    resolve({
                        duration
                    })
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

export const getVideoFile = (file: Blob) => {
    return new Promise(async (resolve, reject) => {
        try {
            // convertStreams(file, resolve);

            // const fileName: string = `record-${Date.now()}`;
            //
            // const fileNameToSave: any = await MessagesModel.getToSaveFileName(`${fileName}.webm`, "");
            //
            // const fileReader = new FileReader();
            // fileReader.readAsArrayBuffer(file);
            //
            // fileReader.onload = async function (evt) {
            //
            //
            //     const file: File | any = new File([evt.target.result], fileName, {
            //         type: 'video/webm',
            //         lastModified: Date.now()
            //     });
            //
            //     file.duration = 1.9999999999999998
            //
            //     const fileReaderWebm = new FileReader();
            //     fileReaderWebm.readAsArrayBuffer(file);
            //
            //     fileReaderWebm.onload = async function (evt) {
            //         const wstream = fs.createWriteStream(`${fileNameToSave}`);
            //         wstream.on('finish', async (e) => {
            //             Log.i("fileReader -> wstream = ", wstream)
            //             Log.i("fileReader -> e = ", e)
            //             const thumb = await getThumbnail(fileNameToSave, true);
            //             resolve({thumb, file});
            //         })
            //
            //         wstream.end();
            //     }
            //
            // };


            const fileReader: FileReader = new FileReader();
            fileReader.onload = async (event: any) => {
                const fileName: string = `record-${new Date().toString().replace(/\s+/g, '-').toLowerCase()}`;


                const file: File = new File([event.target.result], fileName, {
                    type: 'video/webm',
                    lastModified: Date.now()
                });

                resolve(file);
            };
            fileReader.readAsArrayBuffer(file);
        } catch (err) {
            reject(err);
        }
    });
};

export const getAudioFile = (file: Blob) => {
    return new Promise((resolve, reject) => {
        try {
            const fileReader: FileReader = new FileReader();
            fileReader.onload = (event: any) => {
                const fileName: string = `audio-${new Date().toString().replace(/\s+/g, '-').toLowerCase()}`;
                const file: File = new File([event.target.result], fileName, {
                    type: 'audio/mpeg',
                    lastModified: Date.now()
                });
                resolve(file);
            };
            fileReader.readAsArrayBuffer(file);
        } catch (err) {
            reject(err);
        }
    });
};

export const getZipFile = (pathName: string) => {
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(pathName, (err, data) => {
                resolve(data);
            })
        } catch (err) {
            reject(err);
        }
    });
};

// refactored

export async function updateUserProfile(params: { firstName: string, lastName: string, avatarFileName: string }) {

    const body = new URLSearchParams();
    body.set("fName", params.firstName);
    body.set("lName", params.lastName);
    body.set("img", params.avatarFileName);

    const response: AxiosResponse = await axios.post(conf.http + conf.api.v3.profile.update, body);
    const data = response.data;

    if (data.status === "SUCCESS") {
        return data.body
    } else {
        throw new Error("INVALID_RESPONSE")
    }

}
