import database from "services/database";
import IDBMessage from "services/database/class/Message";
import {APPLICATION, MESSAGE_TYPES} from "configs/constants";
import Log from "modules/messages/Log";
import * as lf from "lovefield";

export default class IDBCache {
    //Due to time issues there are 2 skip properties for get, this must be changed in future,
    //because this code is not optimal.
    static async get(path, filepath?: string, donSkipVideo?: boolean, skip?: boolean): Promise<any> {
        if ((window as any).fs) {
            const fileName = filepath || await IDBCache.getDb(path);
            return new Promise(async (resolve, reject) => {
                if (!fileName) {
                    resolve();
                } else if ((/\.(mp4)$/i.test(fileName) && !donSkipVideo) || skip) {
                    const fs = (window as any).fs;
                    fs.stat(fileName, (err, stat) => {
                        if (err == null) {
                            resolve(fileName);
                        } else if (err.code == 'ENOENT') {
                            resolve();
                        } else {
                            resolve();
                        }
                    });
                } else {
                    let output: any = [];
                    const fs = (window as any).fs;
                    fs.stat(fileName, (err, stat) => {
                        if (err == null) {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", fileName, true);
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState == XMLHttpRequest.DONE) {
                                    resolve(xhr.response);
                                }
                            }
                            xhr.responseType = "blob";
                            xhr.send();


                            /*if(stat.size > 20000000) {
                                const stream = fs.createReadStream(fileName);
                                stream.on('error', function(){
                                    resolve();
                                });
                                stream.on('data', function(chunk) {
                                    output.push(chunk);
                                });
                                stream.on('end', function() {
                                    const blob = new Blob(output);
                                    resolve(blob);
                                });
                            } else {
                                fs.readFile(`${fileName}`, (err, data) => {
                                if (err) {
                                    resolve()
                                }
                                const blob = new Blob([new Uint8Array(data)]);
                                resolve(blob);
                                });
                            }*/
                        } else if (err.code == 'ENOENT') {
                            resolve();
                        } else {
                            resolve();
                        }
                    });
                }

            });
        } else {
            return IDBCache.getDb(path);
        }
    }

    static async getDb(path): Promise<any> {
        const indexedDB: any = await database.getCacheDB();
        return new Promise(function (resolve, reject) {

            // @ts-ignore
            const objectStore = indexedDB.transaction("cache", IDBTransaction.READ_ONLY || 'readonly').objectStore("cache");

            if (path) {
                const request = objectStore.get(path);

                request.onsuccess = function (event) {

                    const result = event.target.result;

                    if (result === undefined) {
                        resolve()
                    } else {
                        resolve(result)
                    }
                };
                request.onerror = function (error) {

                    reject(error)
                }
            } else {
                resolve("");
            }
        });
    }

    static async getAll(): Promise<any> {
        const indexedDB: any = await database.getCacheDB();

        return new Promise(async function (resolve, reject) {
            // @ts-ignore
            const objectStore = indexedDB.transaction("cache", IDBTransaction.READ_ONLY || 'readonly').objectStore("cache");
            const allKeys = await objectStore.getAllKeys()
            const allValues = await objectStore.getAll()
            const result = allKeys.reduce((acc, item, index) => {
                acc[item] = allValues[index]
                return acc
            }, {})

            resolve(result)
        });
    }



    static async getToSaveFileName(fileNameToSave: string) {
        const fileNameParts = fileNameToSave.replace(/\r?\n|\r/g, "").replace(/[\\/:*?\"<>|]/g, "").replace(/(%22)/g, "_").split(/\.(?=[^\.]+$)/);

        return new Promise(async (resolve, reject) => {
            if (fileNameParts.length === 2) {
                const fileName = fileNameParts[0].replace(/ /g, "");
                const fileExtension = fileNameParts[1];
                await (window as any).ipcRenderer.send('openMainFolder');
                const fs = (window as any).fs;
                let counter = 0;
                let fileNameSpace = " ";
                if (fileExtension === "mp4") {
                    //Chrome reads filenames with spaces natively
                    fileNameSpace = "";
                }
                while (true) {
                    const counterPart = counter > 0 ? `(${counter})` : "";
                    const exist = await new Promise(async (resolve, reject) => {
                        fs.access(`${fileName}${counterPart}.${fileExtension}`, fs.constants.F_OK, async (err) => {
                            resolve(!err);
                        });
                    });

                    if (!exist) {
                        break;
                    } else {
                        counter++;
                    }
                }
                let fileSeparator = "/";
                if ((window as any).isWin) {
                    fileSeparator = "\\";
                }
                resolve(`${(window as any).remote.process.cwd()}${fileSeparator}${fileName}${counter > 0 ? `${fileNameSpace}(${counter})` : ""}.${fileExtension}`);
            } else {
                resolve();
            }
        });
    }

    //The 3rd can be a string,
    static async set(file: Blob | File, path: string, messageToSave): Promise<any> {
        if ((window as any).fs && !file["path"]) {
            await (window as any).ipcRenderer.send('openMainFolder');
            const message = (typeof messageToSave !== "string") ? messageToSave : await IDBMessage.getMessageById(messageToSave);
            const messageId = (typeof messageToSave !== "string") ? (messageToSave.id || messageToSave.messageId) : messageToSave;
            let fileName = "";
            let fileExtension = "";

            let messageFile: any = null;
            if (message && message.info) {
                try {
                    messageFile = JSON.parse(message.info);
                } catch {
                }
            }
            if (message && messageFile && messageFile.fileName && messageFile.fileName.length > 0) {
                fileName = messageFile.fileName;
                fileExtension = messageFile.fileType;
            } else if (message && message.type === MESSAGE_TYPES.audio || message && message.type === MESSAGE_TYPES.voice) {
                fileName = messageId;
                fileExtension = "mp3";
            } else if (message && (message.type === MESSAGE_TYPES.video || message.type === MESSAGE_TYPES.stream_file)) {
                fileName = file['duration'] ? `${messageId}_record` : fileName = messageId;
                fileExtension = "mp4";
            } else if (message && message.type === MESSAGE_TYPES.image) {
                fileName = messageId;
                fileExtension = (file && file.type && file.type.match(/image\/gif/)) ? "gif" : "jpg";
            } else if (message && message.type === MESSAGE_TYPES.gif) {
                fileName = `gif/${path}`;
                fileExtension = "gif";
            } else {
                return null;
            }

            return new Promise(async (resolve, reject) => {
                const fs = (window as any).fs;
                const fileNameToSave: any = await IDBCache.getToSaveFileName(`${fileName}.${fileExtension}`);
                const fileReader = new FileReader();
                fileReader.readAsArrayBuffer(file);
                fileReader.onload = async function () {
                    if (message.type === MESSAGE_TYPES.video || message.type === MESSAGE_TYPES.stream_file || message.type === MESSAGE_TYPES.file) {
                        const wstream = fs.createWriteStream(`${fileNameToSave}`);
                        wstream.on('finish', async () => {
                            await IDBCache.setDB(fileNameToSave, path);
                            resolve(file);
                        });
                        // @ts-ignore
                        const length = Math.ceil(this.result.byteLength / 2000000);
                        for (let i = 0; i <= length; i++) {
                            wstream.write(Buffer.from(this.result.slice(i * 2000000, i * 2000000 + 2000000)));
                        }
                        wstream.end();
                    } else {
                        fs.writeFile(fileNameToSave, Buffer.from(this.result), async (err, data) => {
                            if (err) {
                                resolve()
                            }
                            await IDBCache.setDB(fileNameToSave, path);
                            resolve(file);
                        });
                    }
                };
            });
        } else {
            return IDBCache.setDB(file["path"] ? file["path"] : file, path);
        }
    }

    static async setDB(file: Blob | File | string, path: string): Promise<any> {
        const indexedDB: any = await database.getCacheDB();
        try {
            // @ts-ignore
            const objectStore = indexedDB.transaction("cache", IDBTransaction.READ_WRITE || 'readwrite').objectStore("cache");
            const request = objectStore.put(file, path);

            return new Promise(function (resolve, reject) {
                request.onsuccess = function (event) {
                    resolve(file)
                };
                request.onerror = function (error) {
                    reject(error)
                };
            });
        } catch (error) {
            return Promise.reject(error)
        }
    }

    static async checkFileInFolder(message: any, blobUri?: any) {
        const messageToSave = message.toJS();
        const remotePath = messageToSave.fileRemotePath;
        const blobUrl = (messageToSave.file && messageToSave.file.preview ? messageToSave.file.preview : "") || messageToSave.blobUrl || blobUri;

        const filePath = await IDBCache.getDb(remotePath);
        if (!filePath) {
            return false;
        }

        return new Promise(function (resolve, reject) {
            (window as any).fs.access(filePath, (window as any).fs.F_OK, (err) => {
                if (err) {
                    if (blobUrl && !/\.(mp4)$/i.test(blobUrl)) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', blobUrl, true);
                        xhr.responseType = 'blob';
                        xhr.onload = async function (e) {
                            if (this.status == 200) {
                                const myBlob = this.response;
                                await IDBCache.set(myBlob, remotePath, messageToSave);
                                const fileNewPath = IDBCache.getDb(remotePath);
                                resolve(fileNewPath);
                            } else {
                                resolve();
                            }
                        };
                        xhr.send();
                    } else {
                        resolve();
                    }
                } else {
                    resolve(filePath);
                }
            });
        });
    }
}
