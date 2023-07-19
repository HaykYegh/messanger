import database from "services/database";
import {APPLICATION, MESSAGE_TYPES} from "configs/constants";
import IDBMessage from "services/database/class/Message";
import * as lf from "lovefield";
import Table = lf.schema.Table;
import {Map} from "immutable";
import Log from "modules/messages/Log";
import {getThumbnail, getVideoFile} from "helpers/FileHelper";
import {call, put} from "redux-saga/effects";
import {Store} from "react-redux";
import storeCreator from "helpers/StoreHelper";
import {updateMessageProperty} from "modules/messages/MessagesActions";

export default class MessagesModel {

    static async set(file: Blob | File, remotePath: string, messageToSave, downloadFolderPath: string = ""): Promise<any> {
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
                fileExtension = message.ext || "mp4";
            } else if (message && message.type === MESSAGE_TYPES.image) {
                fileName = messageId;
                fileExtension = (file && file.type && file.type.match(/image\/gif/)) ? "gif" : "jpg";
            } else if (message && message.type === MESSAGE_TYPES.gif) {
                fileName = `gif/${remotePath}`;
                fileExtension = "gif";
            } else {
                return null;
            }

            const store: Store<any> = storeCreator.getStore();

            return new Promise(async (resolve, reject) => {
                const fs = (window as any).fs;
                const fileNameToSave: any = await MessagesModel.getToSaveFileName(`${fileName}.${fileExtension}`, downloadFolderPath);
                // const fileNameToSave: any = "/Users/vhovhann/Downloads/stk/big-buck-bunny_trailer.webm";
                const fileReader = new FileReader();
                fileReader.readAsArrayBuffer(file);

                fileReader.onload = async function (evt) {
                    if (message.type === MESSAGE_TYPES.video || message.type === MESSAGE_TYPES.stream_file || message.type === MESSAGE_TYPES.file) {


                        const wstream = fs.createWriteStream(`${fileNameToSave}`);




                        wstream.on('finish', async (e) => {
                            await MessagesModel.setDB(file, remotePath, fileNameToSave);

                            if (message && (message.type === MESSAGE_TYPES.video || message.type === MESSAGE_TYPES.stream_file)) {
                                const thumb = await getThumbnail(fileNameToSave, true);
                                store.dispatch(updateMessageProperty(messageId, "info", thumb.fileLink))
                                IDBMessage.update(messageId, {info: thumb.fileLink})
                            }

                            resolve(file);
                        })

                        // @ts-ignore
                        const length = Math.ceil(this.result.byteLength / 2000000);
                        for (let i = 0; i <= length; i++) {
                            wstream.write(Buffer.from(this.result.slice(i * 2000000, i * 2000000 + 2000000)));
                        }
                        wstream.end();
                    } else {
                        fs.writeFile(fileNameToSave, Buffer.from(this.result), async (err, data) => {
                            if (err) {
                                reject()
                            }
                            await MessagesModel.setDB(file, remotePath, fileNameToSave, messageToSave);
                            resolve(file);
                        });
                    }
                };
            });
        } else {
            return MessagesModel.setDB(file, remotePath, file["path"], messageToSave);
        }

    }

    static async setDB(file: File | Blob, remotePath: string, localPath: string, messageId?: string): Promise<any> {
        const cacheDb: any = await database.getCacheDB();
        let value: any = {};

        if ((window as any).isDesktop) {
            value = {
                localPath,
                file: null
            };
        } else {
            value = {
                localPath: null,
                file
            };
        }

        if (messageId && file) {
            IDBMessage.update(messageId, {localPath: file})
        }

        return cacheDb.put('cache', value, remotePath);

    }

    static async get(path, filepath?: string, donSkipVideo?: boolean, skip?: boolean): Promise<any> {
        if ((window as any).fs) {
            const fileName = filepath || await MessagesModel.getDb(path);
            return new Promise(async (resolve, reject) => {
                if (!fileName) {
                    resolve();
                } else if ((/\.(webm)$/i.test(fileName) && !donSkipVideo) || skip) {
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
                            const xhr = new XMLHttpRequest();
                            xhr.open("GET", fileName, true);
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState == XMLHttpRequest.DONE) {
                                    resolve(xhr.response);
                                }
                            };
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
            return MessagesModel.getDb(path);
        }
    }


    static async getDb(path): Promise<any> {
        const cacheDb: any = await database.getCacheDB();
        if(path) {
            if ((window as any).isDesktop) {
                const value = await cacheDb.get('cache', path);

                if(value) {
                    if (value.localPath) {
                        return value && value.localPath;
                    }
                }
            } else {
                const value = await cacheDb.get('cache', path);
                return value && value.file;
            }
        }
    }

    static async getToSaveFileName(fileNameToSave: string, downloadFolderPath: string = "") {
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

                if (downloadFolderPath && downloadFolderPath !== "") {
                    resolve(`${downloadFolderPath}${fileSeparator}${fileName}${counter > 0 ? `${fileNameSpace}(${counter})` : ""}.${fileExtension}`);

                } else {
                    resolve(`${(window as any).remote.process.cwd()}${fileSeparator}${fileName}${counter > 0 ? `${fileNameSpace}(${counter})` : ""}.${fileExtension}`);
                }
            } else {
                resolve();
            }
        });
    }

    static async checkFileInFolder(message: any, blobUri?: any) {
        const messageToSave = Map.isMap(message) ? message.toJS(): message;
        const remotePath = messageToSave.fileRemotePath;
        const blobUrl = (messageToSave.file && messageToSave.file.preview ? messageToSave.file.preview : "") || messageToSave.blobUrl || blobUri;

        const filePath = await MessagesModel.getDb(remotePath);
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
                                await MessagesModel.set(myBlob, remotePath, messageToSave);
                                const fileNewPath = MessagesModel.getDb(remotePath);
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


    static async getLastMessage(threadId: string) {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const message = await db.select()
            .from(messagesTbl)
            .where(lf.op.and(messagesTbl.threadId.eq(threadId), messagesTbl.deleted.eq(false)))
            .orderBy(messagesTbl.time, lf.Order.DESC)
            .limit(1)
            .exec();

        return message[0];
    }

    static async isThreadEmpty(threadId: string) {
        const db: lf.Database = await database.getDB();
        const messagesTbl: Table = db.getSchema().table(APPLICATION.DATABASE.TABLES.MESSAGES);

        const result: any[] = await db.select(lf.fn.count(messagesTbl.id).as("count"))
            .from(messagesTbl)
            .where(messagesTbl.threadId.eq(threadId))
            .exec();

        return !(result[0] && result[0].count);

    }

}
