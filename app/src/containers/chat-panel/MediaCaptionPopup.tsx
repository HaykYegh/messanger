"use strict";
import * as React from "react";
import {connect} from "react-redux";
import {fromJS, List} from "immutable";

import {
    FILE_PREVIEW_MAX_SIZE,
    IMAGE_MIME_TYPE,
    MOUSE_WHEEL_SPEED,
    SUPPORTED_IMAGE_FORMATS,
    VIDEO_MIME_TYPE,
    ENTER_KEY_CODE
} from "configs/constants";
import selector from "services/selector";
import "scss/pages/chat-panel/MediaCaptionPopUp";
import {getBlobUri, getFileColor, getFileDetails, getThumbnail} from "helpers/FileHelper";
import {pluralForm} from "helpers/DataHelper";
import components from "configs/localization";
import {escapeText} from "helpers/MessageHelper";
import {emojify, demojify} from "helpers/EmojiHelper";

interface IMediaCaptionPopupProps {
    sendFiles: (file: any, voiceDuration: number, caption?: string, thumb?: string) => void;
    toggleMediaCaptionPopup: () => void;
    closeMediaCaptionPopup: () => void;
    removeReplyMessage: () => void;
    selectedThread: any;
    files: any
}

interface IMediaCaptionPopupState {
    loaded: List<any>;
    currentFile: any;
    loadedImage: boolean;
    loadingFinished: boolean;
}

class MediaCaptionPopup extends React.Component<IMediaCaptionPopupProps, IMediaCaptionPopupState> {

    constructor(props: any) {
        super(props);

        this.state = {
            currentFile: null,
            loadedImage: true,
            loaded: null,
            loadingFinished: false
        };
    }

    inputArea: HTMLDivElement;

    handleRemoveFile = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        const {loaded, currentFile} = this.state;
        const {closeMediaCaptionPopup} = this.props;
        const newState: any = {...this.state};

        const index = loaded.findIndex((item) => item.get("Index.tsx") === currentFile.get("Index.tsx"));
        const lastIndex = loaded.findLastIndex((item) => item.get("file"));
        const selectedIndex = parseInt(event.currentTarget.getAttribute("data-key"));

        newState.loaded = loaded.delete(parseInt(event.currentTarget.getAttribute("data-key")));

        if (newState.loaded && newState.loaded.size > 0) {
            if (index == lastIndex && index == selectedIndex) {
                newState.currentFile = loaded.get(index - 1);
            } else if (index !== lastIndex && index == selectedIndex) {
                newState.currentFile = loaded.get(index + 1);
            }
        } else {
            newState.currentFile = null;
            //closeMediaCaptionPopup();
        }
        this.setState({
            loaded: newState.loaded,
            currentFile: newState.currentFile
        });
        if (this.inputArea) {
            this.inputArea.innerHTML = newState.currentFile && newState.currentFile.get("caption");
            if (!newState.currentFile) {
                this.inputArea.innerHTML = "";
            }
        }
    };

    handleCurrentFileChange = ({currentTarget}: React.MouseEvent<HTMLElement>) => {
        const {loaded} = this.state;
        const newState: any = {...this.state};
        newState.currentFile = loaded.get(parseInt(currentTarget.getAttribute("data-key")));
        this.setState({currentFile: newState.currentFile});
        if (this.inputArea) {
            this.inputArea.innerHTML = newState.currentFile.get("caption");
        }
    };

    handleCaptionChange = ({currentTarget}: any) => {
        let {currentFile, loaded} = this.state;
        const value = currentTarget.innerHTML;
        const index = loaded.findIndex((item) => item.get("file").name === currentFile.get("file").name);
        loaded = loaded.update(index, (item) => {
            return item.set("caption", value);
        });
        currentFile = currentFile.set("caption", value);
        this.setState({loaded, currentFile});
    };

    handleFileSend = async ({}: React.MouseEvent<HTMLButtonElement>) => {
        const {sendFiles, closeMediaCaptionPopup, removeReplyMessage} = this.props;
        const {loaded} = this.state;

        closeMediaCaptionPopup();
        const _loaded = loaded.toJS();

        for (let {file, caption, thumbnail} of _loaded) {
            const isVideo: boolean = file && file.type.includes(VIDEO_MIME_TYPE);
            const isImage: boolean = file && file.type.includes(IMAGE_MIME_TYPE) && !file.type.includes("svg");
            const fileTypeFormat = file && file.type.split("/").pop();
            let fileMessage: any;
            let thumb: any;

            if (isVideo) {
                fileMessage = file;
                //fileMessage = await getVideoFile(file);
                // fileMessage.path = file.path;
            } else {
                fileMessage = file;
            }

            if (file && file.type && file.type.match(/image\/gif/)) {
                thumbnail = await getThumbnail(file, false, false);
            }

            const textElement: HTMLDivElement = document.createElement("div");

            textElement.innerHTML = caption;
            const message: any = {
                text: caption ? demojify(textElement).trim() : "#E#F#M#",
                file: fileMessage,
                thumb: thumbnail.img || thumbnail
            };
            setTimeout(() => {
                sendFiles(message.file, null, message.text, message.thumb);
            }, 10);
        }
        setTimeout(() => {
            removeReplyMessage();
        }, 20)
    };

    handleFilesUpload = async ({currentTarget}: React.ChangeEvent<HTMLInputElement>) => {
        if (currentTarget && currentTarget.files.length > 0) {
            const newState: any = {...this.state};
            let loadedCount: number = 0;
            this.setState({loadingFinished: false});
            const loadingFinished = await new Promise(async (resolve, reject) => {
                await Object.keys(currentTarget.files).map(async (key) => {
                    const bin: any = [];
                    const file = currentTarget.files[key];
                    let thumbnail: any = "";
                    const fileTypeFormat = file.type.split("/").pop();

                    if (file && file.type && file.type.match(/image\/gif/)) {
                        thumbnail = await getThumbnail(file, false, true);
                    } else if (file.type.includes(IMAGE_MIME_TYPE) && !file.type.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none")) {
                        thumbnail = await getThumbnail(file, false);
                    } else if (file.type.includes(VIDEO_MIME_TYPE)) {
                        thumbnail = await getThumbnail(file, true);
                    }
                    bin.push({
                        file: file,
                        caption: "",
                        thumbnail: thumbnail.img || thumbnail,
                        index: `${file.name}${(Math.random() * 1000).toFixed()}`
                    });

                    if (newState.loaded.size === 1) {
                        if (newState.loaded.toJS && newState.loaded.toJS()[0]) {
                            const firstElement = newState.loaded.toJS()[0];
                            if (firstElement.file === null && firstElement.caption === "" && firstElement.thumbnail === "") {
                                newState.loaded = fromJS([]);
                            }
                        }
                    }

                    newState.loaded = newState.loaded.concat(fromJS(bin));
                    if (newState.loaded.size === 1) {
                        this.setState({loaded: newState.loaded, currentFile: fromJS(bin[0])});
                    } else {
                        this.setState({loaded: newState.loaded});
                    }
                    loadedCount++;
                    if (currentTarget.files.length === loadedCount) {
                        resolve(true)
                    }
                });
            });
            this.setState({loadingFinished: true});
            currentTarget.value = "";
        } else {
            return;
        }
    };

    handleScroll = (e: any) => {
        const fileList = (this.refs.fileList as any);
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        fileList.scrollLeft -= (delta * MOUSE_WHEEL_SPEED); // Multiplied by 40
        e.preventDefault();
    };

    handleImageLoad = () => {
        this.setState({
            loadedImage: false
        })
    };

    async componentDidMount() {
        document.addEventListener("keyup", this.handleEscapePress);
        const {files}: any = this.props;
        const newState: any = {...this.state};
        let firstIsDetected: boolean = false;
        if (newState.loaded == null) {
            newState.loaded = fromJS([]);
        }

        const loadingFinished = await new Promise(async (resolve, reject) => {
            await Object.keys(files).map(async (key, index) => {
                const bin: any = [];
                const file = files[key];
                let thumbnail: any = "";
                let isDirectory: boolean = false;
                const fileTypeFormat = file.type.split("/").pop();

                if (!fileTypeFormat && (window as any).isDesktop && file.path) {
                    const isPath = (window as any).fs.lstatSync(file.path).isDirectory()
                    if (isPath) {
                        isDirectory = true;
                    }
                }
                if (file && file.type && file.type.match(/image\/gif/)) {
                    thumbnail = await getThumbnail(file, false, true);
                } else if (file.type.includes(IMAGE_MIME_TYPE) && !file.type.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none")) {
                    thumbnail = await getThumbnail(file, false);
                } else if (file.type.includes(VIDEO_MIME_TYPE)) {
                    thumbnail = await getThumbnail(file, true);
                }
                bin.push({
                    file: isDirectory ? null : file,
                    caption: "",
                    thumbnail: thumbnail.img || thumbnail,
                    index: isDirectory ? null : `${file.name}${(Math.random() * 1000).toFixed()}`
                });
                if ((newState.loaded.size === 0 && bin[0].file === null && bin[0].caption === "" && bin[0].thumbnail !== "")
                    || bin[0].file !== null || bin[0].caption !== "" || bin[0].thumbnail !== "") {
                    newState.loaded = newState.loaded.concat(fromJS(bin));
                }

                if (!firstIsDetected && !isDirectory) {
                    firstIsDetected = true;
                    this.setState({loaded: newState.loaded, currentFile: fromJS(bin[0])});
                } else {
                    this.setState({loaded: newState.loaded});
                }
                if (files.length === newState.loaded.size) {
                    resolve(true);
                }
            });
        });

        this.setState({loadingFinished: true});
    }

    componentWillMount(): void {
        document.removeEventListener("keyup", this.handleEscapePress);
    }

    handleEscapePress = (event: any): void => {
        if (event.key === "Escape") {
    this.props.closeMediaCaptionPopup();
        }
    };

    handleCaptionPaste = (event) => {

        const textss = emojify(event.clipboardData.getData('Text'));
        if (!Array.isArray(textss)) {
            return;
        }
        event.preventDefault();

        let {currentFile, loaded} = this.state;

        const text = emojify(event.clipboardData.getData('Text')).join("");
        const inputText = event.currentTarget.innerHTML
        const target = document.createTextNode("\u0001");
        const target1 = document.createTextNode("\u0002");
        document.getSelection().getRangeAt(0).insertNode(target);
        document.getSelection().getRangeAt(0).collapse(false);
        document.getSelection().getRangeAt(0).insertNode(target1);
        const position = event.currentTarget.innerHTML.indexOf("\u0001");
        const position2 = event.currentTarget.innerHTML.indexOf("\u0002");
        target.parentNode.removeChild(target);
        target1.parentNode.removeChild(target1);

        event.currentTarget.innerHTML = inputText.slice(0, position) + text + "<span id='mediaCaretTempElement'></span>" + inputText.slice(position2 - 1);
        const caretElement = document.getElementById("mediaCaretTempElement");

        let range = document.createRange();
        let sel = window.getSelection();
        range.setStart(caretElement, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        if (!(event.currentTarget.scrollTop < caretElement.offsetTop && ((event.currentTarget.scrollTop + event.currentTarget.offsetHeight) > caretElement.offsetTop + 22))) {
            event.currentTarget.scrollTop = caretElement.offsetTop;
        }

        event.currentTarget.removeChild(caretElement);

        const index = loaded.findIndex((item) => item.get("file").name === currentFile.get("file").name);
        loaded = loaded.update(index, (item) => {
            return item.set("caption", event.currentTarget.innerHTML);
        });
        currentFile = currentFile.set("caption", event.currentTarget.innerHTML);
        this.setState({loaded, currentFile});
    };

    componentDidUpdate() {
        const fileList = (this.refs.fileList as any);
        if (fileList) {
            fileList.addEventListener("mousewheel", this.handleScroll, false);
            fileList.addEventListener("DOMMouseScroll", this.handleScroll, false);
        }

        const element = document.getElementById("mediaPopupCaption");
        element && element.focus();
        this.setState({loadingFinished: true});
    }

    shouldComponentUpdate(nextProps: IMediaCaptionPopupProps, nextState: IMediaCaptionPopupState): boolean {
        const {currentFile, loaded, loadedImage, loadingFinished}: any = this.state;
        return currentFile && !currentFile.equals(nextState.currentFile) ||
            loadingFinished !== nextState.loadingFinished ||
            loaded !== nextState.loaded ||
            loadedImage !== nextState.loadedImage;
    }

    render(): JSX.Element {
        const {closeMediaCaptionPopup}: any = this.props;
        const {loaded, currentFile, loadedImage, loadingFinished}: any = this.state;
        const captionValue: string = currentFile ? currentFile.get("caption") : "";
        const localization: any = components().mediaPopUp;
        const fileTypeFormat = currentFile && currentFile.get("file").type.split("/").pop();
        const isImage: boolean = currentFile && currentFile.get("file").type.includes(IMAGE_MIME_TYPE) && !currentFile.get("file").type.includes("svg") && SUPPORTED_IMAGE_FORMATS.includes(fileTypeFormat ? fileTypeFormat.toLowerCase() : "none");
        const isVideo: boolean = currentFile && currentFile.get("file").type.includes(VIDEO_MIME_TYPE) && currentFile.get("thumbnail");
        const file: any = getFileDetails(currentFile);
        const fileClass: string = getFileColor(file.type);
        const type = "data:image/jpeg;base64,";
        const currentFileBlob = currentFile && currentFile.get("thumbnail") && type.concat(currentFile.get("thumbnail"));
        const bigSizeImage: boolean = currentFile && currentFile.get("file") && currentFile.get("file").type && !currentFile.get("file").type.includes(VIDEO_MIME_TYPE) && currentFile.get("file").size / 1024 / 1024 > FILE_PREVIEW_MAX_SIZE;
        let count: number = 0;
        loaded && loaded.size >= 0 && loaded.map((item) => {
            if (item.get("file")) {
                count++;
            }
        });

        return (
            <div className="media-caption-popup">
                <div className="media-caption-popup-content">
                    {
                        loaded && count >= 0 ? <div className="caption-content">
                                <div className="caption-title">
                                    <h1 className="number-files">
                                        {`${localization.send} ${loaded && count + " " + pluralForm(count, [localization.file.toLowerCase(), localization.files_a, localization.files])}`}
                                    </h1>
                                </div>
                                <div className="image-preview">
                                    {isVideo && <span className="video-icon"/>}
                                    {isImage && count && !bigSizeImage || isVideo ?
                                        <img className={loadedImage ? "current-image visibility-hidden" : "current-image"}
                                             src={currentFileBlob} onLoad={this.handleImageLoad}/>
                                        : (count ?
                                            <div className="current-file">
                                        <span className={`file-bg ${fileClass}`}>
                                            <span
                                                className="file-text">{file.type && file.type.length > 4 ? localization.file.toLowerCase() : file.type}</span>
                                        </span>
                                                <h2 className="file-name">{file.name}</h2>
                                                <p className="file-size">{file.size}</p>
                                            </div> : <div></div>)
                                    }
                                    {isImage && loadedImage && !bigSizeImage || (isVideo && loadedImage) &&
                                    <div className="image_loader"/>}
                                </div>
                                <div className={isImage || isVideo ? "caption-text" : "caption-text caption-hidden"}>
                                    <div className="caption"
                                         ref={ref => this.inputArea = ref}
                                         id="mediaPopupCaption"
                                         data-name="caption"
                                         onInput={this.handleCaptionChange}
                                         onPaste={this.handleCaptionPaste}
                                         data-placeholder={localization.placeholder}
                                         contentEditable={true}/>
                                </div>
                                <div className="list-block">
                                    <div className="file-list" ref="fileList" onWheel={this.handleScroll}>
                                        {(loaded && loaded.size) ? loaded.map((loadedFile, i) => {
                                            if (!loadedFile.get("file")) {
                                                return;
                                            }
                                            const fileInfo: any = getFileDetails(loadedFile);
                                            const fileClass: string = getFileColor(fileInfo.type);
                                            const type = "data:image/jpeg;base64,";
                                            const loadedFileTypeFormat = loadedFile.get("file").type.split("/").pop();
                                            const fileBlob: string = loadedFile.get("thumbnail") ? type.concat(loadedFile.get("thumbnail")) : getBlobUri(loadedFile.get("file"));
                                            const hasThumbnail: boolean = loadedFile.get("thumbnail") && (loadedFile.get("file").type.includes(VIDEO_MIME_TYPE) || loadedFile.get("file").type.includes(IMAGE_MIME_TYPE));
                                            const bigSizeImage: boolean = loadedFile.get("file").size / 1024 / 1024 > FILE_PREVIEW_MAX_SIZE;
                                            return (
                                                <div
                                                    className={currentFile && loadedFile.get("index") === currentFile.get("index") ? "file-block file-block-active" : "file-block"}
                                                    key={i}
                                                    data-key={i}
                                                    onClick={this.handleCurrentFileChange}>
                                                    {
                                                        loadedFile.get("file").type.includes(IMAGE_MIME_TYPE) && !loadedFile.get("file").type.includes("svg")
                                                        && SUPPORTED_IMAGE_FORMATS.includes(loadedFileTypeFormat ? loadedFileTypeFormat.toLowerCase() : "none") && !bigSizeImage || (loadedFile.get("file").type.includes(VIDEO_MIME_TYPE) && hasThumbnail) ?
                                                            <div className="image-block">
                                                                <img className="image-item" src={fileBlob}/>
                                                                {loadedFile.get("file").type.includes(VIDEO_MIME_TYPE) &&
                                                                <span className="video-icon"/>}
                                                            </div>
                                                            :
                                                            <div className="file-item">
                                                                <span className={`file-bg ${fileClass}`}>
                                                                    <span
                                                                        className="file-text">{fileInfo.type.length > 4 ? "file" : fileInfo.type}</span>
                                                                </span>
                                                                <h2 className="file-name">{fileInfo.name}</h2>
                                                            </div>
                                                    }
                                                    <div className="overlay">
                                                        <button className="delete-button" data-key={i}
                                                                onClick={this.handleRemoveFile}/>
                                                    </div>
                                                </div>
                                            )
                                        }) : <div></div>}
                                        <div className="file-block">
                                            <button className="plus-icon"/>
                                            <input onChange={this.handleFilesUpload} id="file_upload" type="file"
                                                   className="input-item" multiple={true}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="caption-buttons">
                                    <button className="add-file-btn">{localization.addFiles}
                                        <input onChange={this.handleFilesUpload} type="file" className="add-file-input"
                                               multiple={true}/>
                                    </button>
                                    <button className="cancel-btn"
                                            onClick={closeMediaCaptionPopup}>{localization.cancel}</button>
                                    <button
                                        className={(loaded && loaded.size && loadingFinished) ? "send-btn" : "send-btn disabled-button"}
                                        onClick={this.handleFileSend}>{localization.send}</button>
                                </div>
                            </div> :
                            <span className="image-loader">
                             <div className="loader">
                                  <div className="circular-loader">
                                        <div className="loader-stroke">
                                            <div className="loader-stroke-left"/>
                                            <div className="loader-stroke-right"/>
                                        </div>
                                    </div>
                             </div>
                         </span>
                    }
                </div>
            </div>

        );
    }
}

const mapStateToProps: any = state => selector(state);

const mapDispatchToProps: any = dispatch => ({});

export default connect<{}, {}, IMediaCaptionPopupProps>(mapStateToProps, mapDispatchToProps)(MediaCaptionPopup);
