"use strict";

import * as React from "react";
import isEqual from "lodash/isEqual";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {downloadFromUrlWithName, getAudioMeta, getBlobUri, getFileColor, handleFileSize} from "helpers/FileHelper";
import IDBMessage from "services/database/class/Message";
import PopUpMain from "components/common/PopUpMain";
import {LOAD_STATUS, LOG_TYPES, LOGS_LEVEL_TYPE, MUSIC_EXT_LIST} from "configs/constants";
import components from "configs/localization";
import {writeLog} from "helpers/DataHelper";
import {scrollToBottom} from "helpers/UIHelper";
import MessagesModel from "modules/messages/MessagesModel";
import {
    FileInfo,
    FileName,
    FileSize,
    Icon, IconText,
    MessageBlock, MessageDate, MessageIcon, MessageInfo,
    ShowInFolder
} from "containers/SharedMedia/style";
import {format} from "date-fns";
import {getFileIcon} from "helpers/AppHelper";

const file_unknown: any = require("assets/images/file_unknown.svg");
const music_pause: any = require("assets/images/music_pause.svg");
const music_play: any = require("assets/images/music_play.svg");

interface IFileMessageProps {
    data: string;
    link: string;
    msgId: string;
    percentage: number;
    showProgress: boolean;
    fromSharedMedia?: boolean;
    createMessage?: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value) => void;
    deleteMessage?: (msgId) => void;
    uploadFile?: (messages: any, file: any) => void;
    resetConversationLastMessage?: (threadId: string) => void;
    sharedMediaPanel?: boolean;
    showSharedMedia?: boolean;
    message: any;
    messagesLoadStatus?: any;
    searchedActiveMessage?: string;
    file: File;
    messagesLoadedByShowMore?: boolean
    isFilesEditing: boolean;

    handleAudioChange: (audio: HTMLAudioElement) => void;

}

interface IFileMessageState {
    showLoader: boolean;
    progress: number;
    _file: any;
    loadCancelled: boolean;
    uploadStarted: boolean;
    showErrorPopup: boolean;
    highlightText: string;

    isPlaying: boolean;
    audioTime: number;
    audioFile: Blob | File;
    meta: any;
}

export default class FileMessage extends React.Component<IFileMessageProps, IFileMessageState> {

    mounted: boolean = true;

    blobUri: string;

    audio: HTMLAudioElement;

    constructor(props) {
        super(props);

        this.state = {
            showLoader: false,
            progress: 0,
            loadCancelled: false,
            uploadStarted: false,
            showErrorPopup: false,
            highlightText: "",
            _file: null,

            isPlaying: false,
            audioTime: 0,
            audioFile: null,
            meta: {}
        };
    }

    async componentDidMount() {
        const {message} = this.props;
        const loadStatus = message.get("loadStatus");
        const msgId = message.get("id") || message.get("messageId");

        document.addEventListener("messageSearch", this.handleMessageEvent);
        document.addEventListener(msgId, this.handleFileUpload);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true});
        } else {
            this.startLoadProcess(true);
        }
    }

    shouldComponentUpdate(nextProps: IFileMessageProps, nextState: IFileMessageState) {
        const {link, data, msgId, showProgress, percentage, message, searchedActiveMessage, isFilesEditing} = this.props;

        if (message && message.get("IsTransferred") !== nextProps.message.get("IsTransferred")) {
            return true;
        }

        if (link !== nextProps.link) {
            return true;
        }

        if (data !== nextProps.data) {
            return true;
        }

        if (msgId !== nextProps.msgId) {
            return true;
        }

        if (showProgress !== nextProps.showProgress) {
            return true;
        }

        if (isFilesEditing !== nextProps.isFilesEditing) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (percentage !== nextProps.percentage) {
            return true;
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IFileMessageProps, prevState: IFileMessageState) {
        const {message} = this.props;
        const messageIsEmpty = !message && !prevProps.message;
        const {showLoader, uploadStarted, progress} = this.state;
        const isUpload = showLoader && uploadStarted;

        if ((!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred"))) {
            this.setState({showLoader: false, progress: 0, uploadStarted: false});
        }

        if (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload) {
            this.setState({showLoader: false, uploadStarted: false});
        }

        if (progress !== prevState.progress && progress === 0) {
            // scrollToBottom();
        }

    }

    componentWillUnmount() {
        const {message} = this.props;
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(message.get("id") || message.get("messageId"), this.handleFileUpload);
        this.mounted = false;
    }

    handleFileUpload = async ({detail: {progress, blob, loadStatus}}) => {
        const {deleteMessage, resetConversationLastMessage, messagesLoadedByShowMore, message, showSharedMedia} = this.props;
        const obj: any = {};
        const msgId = message.get("id") || message.get("messageId");
        if (blob) {
            if (MUSIC_EXT_LIST.includes(JSON.parse(message.get("info")).fileType)) {
                const audioUrl = getBlobUri(blob);
                obj["meta"] = await getAudioMeta(audioUrl);
            }
            obj["_file"] = blob;
            obj["uploadStarted"] = false;
            obj["showLoader"] = false;
            obj["progress"] = 0;

        } else {
            const {showLoader} = this.state;
            if (!showLoader) {
                obj["showLoader"] = true;
            }
            obj["progress"] = progress;
        }

        if (progress === 100) {
            const messageToSharedMedia = {...message.toJS()};
            messageToSharedMedia.loadStatus = LOAD_STATUS.UPLOAD_SUCCESS;
        }

        if (loadStatus) {
            obj["loadCancelled"] = true;
            const {updateMessageProperty} = this.props;

            if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL) {
                // deleteMessage(msgId);
                // resetConversationLastMessage(message.get("threadId"));
                updateMessageProperty(msgId, "loadStatus", loadStatus);
            } else {
                updateMessageProperty(msgId, "loadStatus", loadStatus);
            }
        } else {
            obj["loadCancelled"] = false;
        }
        if (!messagesLoadedByShowMore) {
            // scrollToBottom();
        }
        if (this.mounted) {
            this.setState(obj);
        }
    };

    startLoadProcess = async (loadStarted?: any) => {
        const {message, createMessage, file, downloadFile, uploadFile, fromSharedMedia} = this.props;
        const {loadCancelled, _file, uploadStarted, meta} = this.state;
        const msgId = message.get("id") || message.get("messageId");
        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;

        if ((!file && !_file) || message.get("IsTransferred")) {
            let _file: Blob | File;
            _file = await MessagesModel.get(message.get("fileRemotePath"), '', false, !MUSIC_EXT_LIST.includes(JSON.parse(message.get("info")).fileType));
            const {showLoader} = this.state;

            if (!_file && (loadStatus === LOAD_STATUS.UPLOAD_SUCCESS || loadStatus === LOAD_STATUS.DOWNLOAD_SUCCESS) && loadStarted === true) {
                this.setState({showLoader: true, loadCancelled: true});
            } else if (!_file) {
                if (this.mounted) {
                    this.setState({showLoader: true, loadCancelled: false});
                }

                const downloadInfo = {
                    fileRemotePath: message.get("fileRemotePath"),
                    threadId: message.get("threadId"),
                    time: message.get("time"),
                    method: "GET",
                    msgId
                };

                if (!showLoader || loadCancelled) {
                    downloadFile(downloadInfo);
                }

            } else if (!_file && uploadStarted) {
                uploadedFileDeleted = true;
            } else {
                if (this.mounted) {
                    if (MUSIC_EXT_LIST.includes(JSON.parse(message.get("info")).fileType)) {
                        const audioUrl = getBlobUri(_file);
                        const audioMeta = await getAudioMeta(audioUrl);
                        this.setState({meta: audioMeta || meta});
                    }
                    if (message.get("loadStatus") === LOAD_STATUS.LOAD_START) {
                        this.setState({_file, showLoader: true, uploadStarted: true});
                    } else {
                        this.setState({_file});
                    }
                }
            }

        } else {
            if (loadStarted !== true) {
                const sendMessage = createMessage(message.toJS());

                if ((window as any).fs) {
                    const fileExist = await MessagesModel.checkFileInFolder(message);
                    if (!fileExist) {
                        uploadedFileDeleted = true;
                    }
                }
                const _fileToUpload = await MessagesModel.get(message.get("fileRemotePath"));
                !uploadedFileDeleted && uploadFile({
                    message: sendMessage,
                    messageToSave: message.toJS()
                }, _fileToUpload);
            }

            let audioMeta: any = null;
            if (Object.keys(meta).length === 0) {
                const audioUrl = getBlobUri(file);
                audioMeta = await getAudioMeta(audioUrl);
            }
            !fromSharedMedia && !uploadedFileDeleted && this.setState({
                meta: audioMeta || meta,
                showLoader: true,
                uploadStarted: true,
                loadCancelled: false
            });
        }
    };

    handleMessageEvent = ({detail: {messageIds, text}}: any): void => {
        const {msgId} = this.props;
        const {highlightText} = this.state;
        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleShowInFolder = async (event, showInFolder: boolean = false) => {
        console.warn("handleShowInFolder");
        event && event.stopPropagation();
        const {message} = this.props;
        const {downloadFile} = this.props;
        const path = await MessagesModel.checkFileInFolder(message, this.blobUri);
        if (path) {
            const loadStatus = message.get("loadStatus");
            if (loadStatus !== LOAD_STATUS.UPLOAD_CANCEL && loadStatus !== LOAD_STATUS.UPLOAD_FAILURE) {
                if (showInFolder) {
                    (window as any).remote.shell.showItemInFolder(path);
                } else {
                    try {
                        (window as any).remote.shell.openItem(path);

                    } catch (e) {
                        writeLog(LOG_TYPES.file, {
                            info: "failed openItem with path:" + path,
                        }, LOGS_LEVEL_TYPE.error);
                    }
                }
            }
        } else {
            const downloadInfo = {
                fileRemotePath: message.get("fileRemotePath"),
                threadId: message.get("threadId"),
                method: "GET",
                msgId: message.get("messageId") || message.get("msgId")
            };
            downloadFile(downloadInfo);
        }
    };

    deleteMessage = async () => {
        const {message, deleteMessage, resetConversationLastMessage} = this.props;
        const messageId = message.get("messageId") || message.get("id");
        if (messageId) {
            await IDBMessage.addMessageStatus(messageId, {loadStatus: LOAD_STATUS.UPLOAD_CANCEL});
            deleteMessage(messageId);
        }
        resetConversationLastMessage(message.get("threadId"));
    };

    handleAudioPause = (event): void => {
        event.preventDefault();
        event.stopPropagation();
        this.audio.pause();
        this.setState({isPlaying: false});
    };

    handleAudioPlay = (event): void => {
        event.preventDefault();
        event.stopPropagation();
        const {handleAudioChange} = this.props;
        handleAudioChange(this.audio);
        this.setState({isPlaying: true});
    };

    handleAudioRef = (ref) => {
        this.audio = ref;
    };

    handleAudioEnd = (): void => {
        this.setState({audioTime: 0, isPlaying: false}, () => {
            this.audio.currentTime = 0;
        });
    };

    handleTimeUpdate = (): void => {
        this.setState({audioTime: this.audio.currentTime});
    };


    render() {
        const {link, data, msgId, file, searchedActiveMessage, message, isFilesEditing} = this.props;
        const {showLoader, _file, highlightText, isPlaying, audioTime, meta} = this.state;
        const fileBlob = file || _file;
        const isLoading = showLoader;
        const fileMessage: any = JSON.parse(data);
        const localization: any = components().chatPanel;
        const details: any = {
            fileName: fileMessage.fileName + "." + fileMessage.fileType,
            fileSize: fileMessage.fileSize,
            fileType: fileMessage.fileType,
            fileLink: link
        };
        const messageInfo = message.get("info");
        const fileType = JSON.parse(messageInfo).fileType;

        let fileUrl: string = this.blobUri;

        if (fileBlob && !this.blobUri) {
            fileUrl = getBlobUri(fileBlob);
            this.blobUri = fileUrl
        }

        const isMusicFile: boolean = MUSIC_EXT_LIST.includes(fileType);
        const isStream = isMusicFile && fileBlob && fileBlob.size > 0;
        const duration = meta && meta.duration && meta.duration > 0 && Math.ceil(meta.duration);


        const downloadFile = async (e) => {
            e.preventDefault();
            if (!isLoading) {
                downloadFromUrlWithName(details.fileName, this.blobUri, msgId)
            }
        };

        let filteredText = details.fileName;
        if (highlightText) {
            const highlightTextArr = filteredText.match(new RegExp(`${highlightText}`, "gi"));
            if (highlightTextArr && highlightTextArr.length > 0) {
                filteredText = filteredText.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText}`, "gi"), match => {
                    return `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                });
            }
        }

        const audioMessageMonth: string = format(message.get("createdAt"), "MMM");
        const audioMessageDay: string = format(message.get("createdAt"), "D");
        const audioMessageTime: string = format(message.get("createdAt"), "HH:mm");
        const audioMessageDate: string = `${audioMessageMonth} ${audioMessageDay} at ${audioMessageTime}`;
        const imageSrc: string = getFileIcon(fileType);
        let imageText: string = "";
        if (imageSrc === file_unknown) {
            if (details.fileType.length <= 3) {
                imageText = details.fileType.toUpperCase();
            } else {
                imageText = "FILE"
            }
        }

        return (
            <MessageBlock isFilesEditing={isFilesEditing}>
                <MessageIcon isChatFileMessage={false}
                             isMusicFileMessage={isMusicFile}
                             background={isMusicFile ? "rgb(22,172,246)" : "none"}
                             borderRadius={isMusicFile ? "50%" : "0"}>
                    <Icon
                        className={isPlaying ? "pause-btn" : "play-btn"}
                        width={isMusicFile ? "36px" : "28px"}
                        src={isMusicFile ? (isPlaying ? music_pause : music_play) : imageSrc}
                        onClick={isPlaying ? this.handleAudioPause : isStream ? this.handleAudioPlay : null}
                    />
                    {
                        imageSrc === file_unknown && !isMusicFile &&
                        <IconText>{imageText}</IconText>
                    }
                </MessageIcon>

                {isMusicFile &&
                <MessageInfo display={"none"}>
                    {isStream ?
                        <React.Fragment>
                            <audio onEnded={this.handleAudioEnd}
                                   onTimeUpdate={this.handleTimeUpdate}
                                   onPause={this.handleAudioPause}
                                   ref={this.handleAudioRef}
                                   preload="auto"
                                   controls={true}
                                   className="audio"
                            >
                                <source src={fileUrl} type="audio/mpeg"/>
                            </audio>
                        </React.Fragment> : ""}
                </MessageInfo>}

                <MessageInfo>
                    {highlightText ? <FileName href={this.blobUri}
                                               onClick={!isFilesEditing ? ((window as any).isDesktop ? this.handleShowInFolder : downloadFile) : null}
                                               dangerouslySetInnerHTML={{__html: filteredText}}/> :
                        <FileName href={this.blobUri}
                                  onClick={!isFilesEditing ? ((window as any).isDesktop ? this.handleShowInFolder : downloadFile) : null}
                        >{filteredText}</FileName>
                    }
                    <FileInfo>
                        <FileSize>
                            {isMusicFile ? (duration ? format(duration * 1000, "mm:ss") : "00:00") : handleFileSize(details.fileSize)} •
                        </FileSize>
                        {
                            (window as any).fs && !showLoader && !isFilesEditing &&
                            <ShowInFolder
                                onClick={(event) => this.handleShowInFolder(event, true)}
                            >{localization.downloadFile}</ShowInFolder>
                        }
                        <MessageDate>
                            &nbsp;{audioMessageDate}
                        </MessageDate>
                    </FileInfo>
                </MessageInfo>
            </MessageBlock>
        );
    }
};
