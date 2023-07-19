"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";

import {
    ESC_KEY_CODE,
    FILE_PREVIEW_MAX_SIZE,
    IMAGE_MIME_TYPE, MESSAGE_BOX_TYPES,
    MOUSE_WHEEL_SPEED,
    SUPPORTED_IMAGE_FORMATS, UNSUPPORTED_FILE_TYPES,
    VIDEO_MIME_TYPE,
} from "configs/constants";
import {getBlobUri, getFileColor, getFileDetails, getThumbnail, getZipFile} from "helpers/FileHelper";
import {pluralForm, showMessageBox} from "helpers/DataHelper";
import components from "configs/localization";

import "scss/pages/chat-panel/FileUploadPopUp.scss";

// const ipcRenderer = (window as any).ipcRenderer;
import fs from "fs";
import path from "path";
// import electron from "@electron/remote"
import archiver from "archiver"
import {setMediaDimensions} from "helpers/DomHelper";
import Log from "modules/messages/Log";

const electron = require("@electron/remote");


interface IFileSenderProps {
    sendFiles: (file: any, voiceDuration: number, caption?: string, thumb?: string, blob?: Blob, amplitudes?: string, options?: any) => void,
    closeFileUploadPopUp: () => void,
    removeReplyMessage: () => void,
    emptyFiles: () => void,
    selectedThread: any,
    files: any
}

interface IFileSenderState {
    loadedFiles: any[],
    currentFile: any,
    isImageLoaded: boolean,
    isLoadingFinished: boolean,
}

export default class FileUploadPopUp extends React.Component<IFileSenderProps, IFileSenderState> {


    get fileUploadContainer(): HTMLDivElement {
        return this._fileUploadContainer;
    }

    set fileUploadContainer(ref: HTMLDivElement) {
        this._fileUploadContainer = ref;
    }

    private _fileUploadContainer: HTMLDivElement = null;

    get zipFile(): Blob {
        return this._zipFile;
    }

    set zipFile(ref: Blob) {
        this._zipFile = ref;
    }

    private _zipFile: Blob = null;

    inputArea: HTMLDivElement;

    fileList: HTMLElement;

    fileDimensions: any = {};

    constructor(props: any) {
        super(props);

        this.state = {
            loadedFiles: [],
            currentFile: null,
            isImageLoaded: false,
            isLoadingFinished: false,
        };
    }

    // startListeners(): void {
    //     ipcRenderer.on("zip", (event, reply) => {
    //         if (reply) {
    //             switch (reply.action) {
    //                 case "ZIP_FOLDER":
    //                     console.log("#########@#########@#######@@#######", reply);
    //                     this.setState({zipFile: reply.result});
    //                     break;
    //                 default:
    //             }
    //         }
    //     });
    // }
    //
    // removeListeners(): void {
    //     ipcRenderer.removeAllListeners("zip");
    // }

    componentDidMount() {

        const appInstance = (electron.app || electron.app);
        const appDataPath = appInstance.getPath('userData');
        const zipFolderDirname = "zip";
        const zipFolderDir = path.join(appDataPath, zipFolderDirname);

        // this.startListeners();

        this._fileUploadContainer.addEventListener("click", this.handleOutSideClick);
        document.addEventListener("keydown", this.handleEscPress);

        const {files, emptyFiles}: any = this.props;

        const newState: IFileSenderState = {...this.state};
        (async () => {
            let index: number = 0;

            for (let i: number = 0; i < files.length; i++) {
                const file: File = files[i];
                const fileType: string = file.type;
                let blob: Blob = null;

                //Thumbnail
                let thumbnail: any = "";
                const fileTypeFormat = file.type.split("/").pop();
                if (file && file.type && file.type.match(/image\/gif/)) {
                    thumbnail = await getThumbnail(file, false, true);
                } else if (file.type.includes(IMAGE_MIME_TYPE) && !file.type.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none")) {
                    thumbnail = await getThumbnail(file, false);
                } else if (file.type.includes(VIDEO_MIME_TYPE)) {
                    thumbnail = await getThumbnail(file, true);
                }


                // Detect and zip folders

                // Todo move to main.development
                if ((window as any).isDesktop && file.path) {
                    const isPath = (window as any).fs.lstatSync(file.path).isDirectory();
                    if (isPath) {

                        // ipcRenderer.send("onZip", {action: "ZIP_FOLDER", file});

                        const folderName = file.path.replace(/^.*[\\\/]/, '');
                        const output = fs.createWriteStream(`${zipFolderDir}/${folderName}.zip`);
                        const archive = archiver('zip', {
                            zlib: {level: 9}
                        });

                        archive.pipe(output);
                        archive.directory(file.path, folderName);

                        output.on('finish', () => {
                            Log.i('completely done');
                        });

                        await archive.finalize();

                        const buffer: any = await getZipFile(`${zipFolderDir}/${folderName}.zip`);
                        blob = new Blob([new Uint8Array(buffer)]);

                        archive.on('error', err => {
                            throw err;
                        });

                        output.on('close', () => {
                            Log.i(archive.pointer() + ' total bytes');
                            Log.i('archiver has been finalized and the output file descriptor has closed.');
                        });

                        fs.unlinkSync(`${zipFolderDir}/${folderName}.zip`);
                    }
                }

                const bin: any = {
                    file,
                    index,
                    caption: "",
                    thumbnail: thumbnail.img || thumbnail,
                    blob
                };

                // this._zipFile = null;

                newState.loadedFiles = [...newState.loadedFiles, bin];
                index++;

                if (!newState.currentFile && newState.loadedFiles) {
                    newState.currentFile = newState.loadedFiles[0];
                }

                if (fileType.includes(IMAGE_MIME_TYPE)) {
                    setMediaDimensions(file, IMAGE_MIME_TYPE, this.fileDimensions, bin.index);
                }

                if (file.type.includes(VIDEO_MIME_TYPE)) {
                    setMediaDimensions(file, VIDEO_MIME_TYPE, this.fileDimensions, bin.index);
                }
            }

            newState.isLoadingFinished = true;

            this.setState(newState);


            if (this.fileList) {
                this.fileList.addEventListener("mousewheel", this.handleFileListScroll, false);
                this.fileList.addEventListener("DOMMouseScroll", this.handleFileListScroll, false);
            }

            if (this.inputArea) {
                this.inputArea.focus();
            }
        })();

        emptyFiles();
    }

    shouldComponentUpdate(nextProps: Readonly<IFileSenderProps>, nextState: Readonly<IFileSenderState>, nextContext: any): boolean {
        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: Readonly<IFileSenderProps>, prevState: Readonly<IFileSenderState>, snapshot?: any): void {
        const {currentFile} = this.state;
        this.inputArea.innerHTML = currentFile && currentFile.caption;
        this.inputArea.focus();
    }

    componentWillUnmount(): void {
        document.removeEventListener("keydown", this.handleEscPress);
        this.fileUploadContainer.removeEventListener("click", this.handleOutSideClick);

        if (this.fileList) {
            this.fileList.removeEventListener("mousewheel", this.handleFileListScroll, false);
            this.fileList.removeEventListener("DOMMouseScroll", this.handleFileListScroll, false);
        }


        // this.removeListeners();
    }

    handleEscPress = (event: any) => {
        const {closeFileUploadPopUp} = this.props;
        if (event.keyCode === ESC_KEY_CODE) {
            closeFileUploadPopUp();
        }
    };

    handleOutSideClick = (event: any) => {
        const {closeFileUploadPopUp} = this.props;
        const popUpBlock = document.getElementById("file-upload-popup-block");

        if (popUpBlock && !popUpBlock.contains(event.target)) {
            closeFileUploadPopUp();
        }
    };

    handleUploadFiles = async ({currentTarget}: React.ChangeEvent<HTMLInputElement>): Promise<any> => {
        if (currentTarget && currentTarget.files.length > 0) {
            const {loadedFiles} = this.state;
            const files: any[] = Array.from(currentTarget.files);
            const newState: IFileSenderState = {...this.state};
            let index: number = loadedFiles.length ? loadedFiles[loadedFiles.length - 1].index : 0;

            const localization: any = components().chatPanel;

            if (files.every(file => UNSUPPORTED_FILE_TYPES.includes(file.type))) {
                showMessageBox(
                    true,
                    MESSAGE_BOX_TYPES.info,
                    [localization.OK],
                    localization.cantBeSent,
                    localization.notSupportedYet,
                    undefined,
                    undefined,
                    0,
                    0,
                    () => false
                );

                return true;
            }

            for (let i: number = 0; i < files.length; i++) {
                const file: File = files[i];

                if (UNSUPPORTED_FILE_TYPES.includes(file.type)) {
                    continue;
                }

                const fileType: any = file.type;

                //Thumbnail
                let thumbnail: any = "";
                const fileTypeFormat = file.type.split("/").pop();
                if (file && file.type && file.type.match(/image\/gif/)) {
                    thumbnail = await getThumbnail(file, false, true);
                } else if (file.type.includes(IMAGE_MIME_TYPE) && !file.type.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none")) {
                    thumbnail = await getThumbnail(file, false);
                } else if (file.type.includes(VIDEO_MIME_TYPE)) {
                    thumbnail = await getThumbnail(file, true);
                }

                const bin: any = {
                    file,
                    index: ++index,
                    caption: "",
                    thumbnail: thumbnail.img || thumbnail
                };

                if (fileType.includes(IMAGE_MIME_TYPE)) {
                    setMediaDimensions(file, IMAGE_MIME_TYPE, this.fileDimensions, bin.index);
                }

                if (fileType.includes(VIDEO_MIME_TYPE)) {
                    setMediaDimensions(file, IMAGE_MIME_TYPE, this.fileDimensions, bin.index);
                }

                newState.loadedFiles = [...newState.loadedFiles, bin];

                if (newState.loadedFiles.length === 1) {
                    newState.currentFile = bin;
                }
            }

            this.setState(newState);
            currentTarget.value = "";
        }
    };

    handleRemoveFile = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const {loadedFiles, currentFile} = this.state;
        const newState: IFileSenderState = {...this.state};
        const currentIndex: number = loadedFiles.findIndex((item) => item.index === currentFile.index);
        const lastIndex: number = loadedFiles.length - 1;
        const selectedIndex: number = parseInt(event.currentTarget.getAttribute("data-key"));

        newState.loadedFiles = loadedFiles.filter((item, i) => i !== selectedIndex);

        if (newState.loadedFiles && newState.loadedFiles.length) {
            if (currentIndex === lastIndex && currentIndex === selectedIndex) {
                newState.currentFile = loadedFiles[currentIndex - 1];
            } else if (currentIndex !== lastIndex && currentIndex === selectedIndex) {
                newState.currentFile = loadedFiles[currentIndex + 1];
            }
        } else {
            newState.currentFile = null;
        }

        this.setState(newState);

        if (this.inputArea) {
            this.inputArea.innerHTML = newState.currentFile ? newState.currentFile.caption : "";
        }
    };

    handleFileSend = ({}: React.MouseEvent<HTMLButtonElement>) => {
        const {sendFiles, closeFileUploadPopUp, removeReplyMessage} = this.props;
        const {loadedFiles} = this.state;

        closeFileUploadPopUp();

        const filesLength: number = loadedFiles.length;

        for (let i = 0; i < filesLength; i++) {
            const {file, caption, thumbnail, blob} = loadedFiles[i];
            const options: any = this.fileDimensions[i] || null;
            sendFiles(file, null, caption, thumbnail, blob, '', options);
        }

        removeReplyMessage();
    };

    handleCurrentFileChange = (e: React.MouseEvent<HTMLElement>) => {
        const {loadedFiles} = this.state;
        const selectedIndex: number = parseInt(e.currentTarget.getAttribute("data-key"));
        const currentFile: any = loadedFiles[selectedIndex];
        this.setState({currentFile});
    };

    handleCaptionChange = ({currentTarget}: React.KeyboardEvent<HTMLDivElement>): void => {
        const {currentFile, loadedFiles} = this.state;
        const newState: IFileSenderState = {...this.state};
        const value: string = currentTarget.innerHTML;
        const index: number = loadedFiles.findIndex(item => item.index === currentFile.index);
        newState.loadedFiles[index].caption = value;
        newState.currentFile.caption = value;
        this.setState(newState);
    };

    handleFileListScroll = (e: any) => {
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        this.fileList.scrollLeft -= (delta * MOUSE_WHEEL_SPEED); // Multiplied by 40
        e.preventDefault();
    };

    handleImageLoad = (): void => {
        this.setState({isImageLoaded: true})
    };

    get isImage(): boolean {
        const {currentFile} = this.state;
        const currentFileType: any = currentFile && currentFile.file && currentFile.file.type;
        const fileTypeFormat: any = currentFileType && currentFileType.split("/").pop();
        return currentFileType && currentFileType.includes(IMAGE_MIME_TYPE) && !currentFileType.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none");
    }

    get isVideo(): boolean {
        const {currentFile} = this.state;
        return currentFile && currentFile.file && currentFile.file.type.includes(VIDEO_MIME_TYPE) && currentFile.thumbnail;
    }

    get count(): number {
        const {loadedFiles} = this.state;
        return loadedFiles.length;
    }

    get currentFileBlob(): string {
        const type = "data:image/jpeg;base64,";
        const {currentFile} = this.state;
        return currentFile && currentFile.thumbnail ? type.concat(currentFile.thumbnail) : currentFile && currentFile.file && getBlobUri(currentFile.file);
    }

    get isBigSizeImage(): boolean {
        const {currentFile} = this.state;
        return currentFile && currentFile.file && currentFile.file.type && !currentFile.file.type.includes(VIDEO_MIME_TYPE) && currentFile.file.size / 1024 / 1024 > FILE_PREVIEW_MAX_SIZE;
    }

    render(): JSX.Element {
        const {closeFileUploadPopUp}: IFileSenderProps = this.props;
        const {loadedFiles, currentFile, isImageLoaded, isLoadingFinished}: IFileSenderState = this.state;
        const localization: any = components().mediaPopUp;
        const file: any = getFileDetails(currentFile);
        const fileClass: string = getFileColor(file.type);

        return (
            <div id="file-upload-popup" className="file-upload-popup" ref={ref => this.fileUploadContainer = ref}>
                <div id="file-upload-popup-block" className="file-upload-popup-block">

                    {!isLoadingFinished && <div className="loader"/>}

                    {isLoadingFinished && <div className="file-upload-popup-container">

                        <div className={"file-upload-popup-header"}>
                            <h2>
                                {`${localization.send} ${loadedFiles && this.count + " " + pluralForm(this.count, [localization.file.toLowerCase(), localization.files_a, localization.files])}`}
                            </h2>
                        </div>

                        <div className={"file-upload-popup-body"}>


                            {/*Image Preview*/}
                            <div className="image-preview">
                                {
                                    this.isVideo && <span className="video-icon"/>
                                }
                                {
                                    this.isImage && this.count && !this.isBigSizeImage || this.isVideo ?
                                        <img
                                            className={`current-image${!isImageLoaded ? " visibility-hidden" : ""}`}
                                            src={this.currentFileBlob}
                                            onLoad={this.handleImageLoad}
                                        />
                                        : (this.count ?
                                        <div className="current-file">
                                                <span className={`file-bg ${fileClass}`}>
                                                    <span className="file-text">
                                                        {file.type && file.type.length > 4 ? localization.file.toLowerCase() : file.type}
                                                    </span>
                                                </span>
                                            <h2 className="file-name">{`${file.name}${currentFile.blob ? ".zip" : ""}`}</h2>
                                            <p className="file-size">{file.size}</p>
                                        </div> : <div/>)
                                }
                                {
                                    this.isImage && !isImageLoaded && !this.isBigSizeImage || (this.isVideo && !isImageLoaded) &&
                                    <div className="image_loader"/>
                                }
                            </div>


                            {/*Caption*/}
                            <div className={`caption-text${this.isImage || this.isVideo ? "" : " caption-hidden"}`}>
                                <div
                                    className="caption"
                                    ref={ref => this.inputArea = ref}
                                    data-name="caption"
                                    onInput={this.handleCaptionChange}
                                    data-placeholder={localization.placeholder}
                                    contentEditable={true}
                                />
                            </div>


                            {/*Files List*/}
                            <div className="list-block">
                                <div className="file-list" ref={ref => this.fileList = ref}>
                                    {loadedFiles.length !== 0 ? loadedFiles.map((loadedFile, i) => {

                                        const fileInfo: any = getFileDetails(loadedFile);
                                        const fileClass: string = getFileColor(fileInfo.type);
                                        const loadedFileTypeFormat = loadedFile.file.type.split("/").pop();
                                        const type = "data:image/jpeg;base64,";
                                        const fileBlob: string = loadedFile.thumbnail ? type.concat(loadedFile.thumbnail) : getBlobUri(loadedFile.file);
                                        const hasThumbnail: boolean = loadedFile.thumbnail && (loadedFile.file.type.includes(VIDEO_MIME_TYPE) || loadedFile.file.type.includes(IMAGE_MIME_TYPE));
                                        const bigSizeImage: boolean = loadedFile.file.size / 1024 / 1024 > FILE_PREVIEW_MAX_SIZE;

                                        return (
                                            <div
                                                key={i}
                                                className={`file-block${currentFile && loadedFile.index == currentFile.index ? " file-block-active" : ""}`}
                                                data-key={i}
                                                onClick={this.handleCurrentFileChange}
                                            >
                                                {
                                                    loadedFile.file.type.includes(IMAGE_MIME_TYPE) && !loadedFile.file.type.includes("svg") &&
                                                    SUPPORTED_IMAGE_FORMATS.includes(loadedFileTypeFormat ? loadedFileTypeFormat.toLowerCase() : "none") && !bigSizeImage ||
                                                    (loadedFile.file.type.includes(VIDEO_MIME_TYPE) && hasThumbnail) ?
                                                        <div className="image-block">
                                                            <img className="image-item" src={fileBlob}/>
                                                            {
                                                                loadedFile.file.type.includes(VIDEO_MIME_TYPE) &&
                                                                <span className="video-icon"/>
                                                            }
                                                        </div>
                                                        :
                                                        <div className="file-item">
                                                                <span className={`file-bg ${fileClass}`}>
                                                                    <span className="file-text">
                                                                        {fileInfo.type && fileInfo.type.length > 4 ? "file" : fileInfo.type}
                                                                    </span>
                                                                </span>
                                                            <h2 className="file-name">{`${fileInfo.name}${currentFile.blob ? ".zip" : ""}`}</h2>
                                                        </div>
                                                }
                                                <div className="overlay">
                                                    <button
                                                        className="delete-button"
                                                        data-key={i}
                                                        onClick={this.handleRemoveFile}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    }) : <div/>}

                                    <div className="file-block">
                                        <button className="plus-icon"/>
                                        <input
                                            onChange={this.handleUploadFiles}
                                            id="file_upload"
                                            type="file"
                                            className="input-item"
                                            multiple={true}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>


                        {/*Buttons*/}

                        <div className="popup-footer">
                            <div className="footer-content">
                                <button className="add-file-btn">{localization.addFiles}
                                    <input
                                        onChange={this.handleUploadFiles}
                                        type="file"
                                        className="add-file-input"
                                        multiple={true}
                                    />
                                </button>
                                <button className="cancel-btn"
                                        onClick={closeFileUploadPopUp}>{localization.cancel}</button>
                                <button
                                    className={"send-btn"}
                                    disabled={!(loadedFiles && loadedFiles.length && isLoadingFinished)}
                                    onClick={this.handleFileSend}
                                >{localization.send}</button>
                            </div>
                        </div>
                    </div>
                    }
                </div>
            </div>

        );
    }
}
