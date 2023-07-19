"use strict";

import * as React from "react";
import {connect} from 'react-redux';
import isEqual from "lodash/isEqual";
import format from "date-fns/format";
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {downloadFromUrlWithName, getAudioMeta, getBlobUri, getFileColor, handleFileSize} from "helpers/FileHelper";
import {LOAD_STATUS, LOG_TYPES, LOGS_LEVEL_TYPE, MESSAGE_TYPES, MUSIC_EXT_LIST} from "configs/constants";
import {Icon, IconText, MessageIcon, MessageInfo} from "containers/SharedMedia/style";
import MessagesModel from "modules/messages/MessagesModel";
import IDBMessage from "services/database/class/Message";
import PopUpMain from "components/common/PopUpMain";
import components from "configs/localization";
import {getFileIcon} from "helpers/AppHelper";
import {writeLog} from "helpers/DataHelper";
import {
    ButtonText,
    EditedMessage,
    IsDeliveryWaiting,
    StatusMessage,
    Time,
    TimeBubble,
    TooltipButton,
    TooltipContent, TooltipText
} from "components/messages/style";
import {FileBlock, FileContent, FileName, FileSize, FileTextBlock, Link} from "./style";
import {getMessageTime} from "helpers/DateHelper";
import {hideMessageModal, showMessageModal} from "modules/application/ApplicationActions";
import Log from "modules/messages/Log";

const file_unknown: any = require("assets/images/file_unknown.svg");
const music_pause: any = require("assets/images/music_pause.svg");
const music_play: any = require("assets/images/music_play.svg");

interface IFileMessageProps {
    fromSharedMedia?: boolean;
    createMessage?: (message: any) => void;
    downloadFile: (downloadInfo: any) => void;
    updateMessageProperty: (msgId, property, value) => void;
    deleteMessage?: (msgId) => void;
    stopProcess: (uploadStarted: any) => void;
    uploadFile?: (messages: any, file: any) => void;
    resetConversationLastMessage?: (threadId: string) => void;
    sharedMediaPanel?: boolean;
    message: any;
    messagesLoadStatus?: any;
    searchedActiveMessage?: string;
    messagesLoadedByShowMore?: boolean;
    handleAudioChange?: (audio: HTMLAudioElement) => void;
    language?: string;
    handleOpenFileInFolder?: (event: React.MouseEvent<HTMLElement>) => void;
    handleShowInFolder?: (event: React.MouseEvent<HTMLElement>) => void;
    forwardMessage: (message?: any) => void;
    handleMessageReply: (repliedPersonally: boolean, message?: any) => void;
    handleMessageDelete: (message?: any) => void;
    handleMenuPopUpOpen?: () => void;
    handleMenuPopUpClose?: () => void;
    showMessageModal?: (modalData: object) => void;
    hideMessageModal?: () => void;
    handelMenuPopUpOpen?: () => void;
    handelMenuPopUpClose?: () => void;
    isOnline?: boolean;
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
    isMenuPopUpOpen: boolean;
    isTooltip: boolean;
    tooltipText: string;
}

class FileMessage extends React.Component<IFileMessageProps, IFileMessageState> {

    mounted: boolean = true;

    blobUri: string;

    contextMenu: any;

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
            meta: {},
            isMenuPopUpOpen: false,
            isTooltip: false,
            tooltipText: ""
        };
    }

    async componentDidMount() {
        const {message} = this.props;
        const loadStatus: number = message.get("loadStatus");
        const msgId: any = message.get("id") || message.get("messageId");

        document.addEventListener("messageSearch", this.handleMessageEvent);
        document.addEventListener(msgId, this.handleFileUpload);
        if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL || loadStatus === LOAD_STATUS.UPLOAD_FAILURE) {
            this.setState({showLoader: true, uploadStarted: true, loadCancelled: true});
            this.startLoadProcess(true);
        } else if (loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE) {
            this.setState({showLoader: true, loadCancelled: true, uploadStarted: false});
        } else {
            this.startLoadProcess(true);
        }
    }

    shouldComponentUpdate(nextProps: IFileMessageProps, nextState: IFileMessageState) {
        const {message, searchedActiveMessage, language, isOnline} = this.props;

        if (message.get("IsTransferred") !== nextProps.message.get("IsTransferred")) {
            return true;
        }

        if (message.get("loadStatus") !== nextProps.message.get("loadStatus")) {
            return true;
        }

        if (message.get("fileLink") !== nextProps.message.get("fileLink")) {
            return true;
        }

        if (message.get("info") !== nextProps.message.get("info")) {
            return true;
        }

        if (message.get("showProgressBar") !== nextProps.message.get("showProgressBar")) {
            return true;
        }

        if (!isEqual(message, nextProps.message)) {
            return true;
        }

        if (nextProps.searchedActiveMessage && nextProps.searchedActiveMessage !== searchedActiveMessage) {
            return true;
        }

        if (message.get('percentage') !== nextProps.message.get('percentage')) {
            return true;
        }

        if (!isEqual(language, nextProps.language)) {
            return true;
        }

        if(isOnline !== nextProps.isOnline) {
            return true
        }

        return !isEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps: IFileMessageProps, prevState: IFileMessageState) {
        const {message, isOnline} = this.props;
        const messageIsEmpty = !message && !prevProps.message;
        const {showLoader, uploadStarted} = this.state;
        const isUpload = showLoader && uploadStarted;

        Log.i("componentDidUpdate -> 1", message.get('loadStatus'))

        if (isOnline !== prevProps.isOnline) {
            this.setState({uploadStarted: false});
            Log.i("componentDidUpdate -> 1.1", message.get('loadStatus'))
        }

        if ((!messageIsEmpty && !prevProps.message.get("IsTransferred") && message.get("IsTransferred"))) {
            Log.i("componentDidUpdate -> 2", message.get('loadStatus'))
            this.setState({showLoader: false, progress: 0, uploadStarted: false});
        }

        if (message.get('loadStatus') === LOAD_STATUS.UPLOAD_SUCCESS && isUpload) {
            Log.i("componentDidUpdate -> 3", message.get('loadStatus'))
            this.setState({showLoader: false, uploadStarted: false});
        }
    }

    handelMenuPopUpOpen = (event) => {
        const targetCoords = event.target.getBoundingClientRect();
        const left: number = (targetCoords.left + targetCoords.width + 9) -
            document.getElementsByClassName("left_side")[0].getBoundingClientRect().width -
            document.getElementsByClassName("app-left-menu")[0].getBoundingClientRect().width;
        const top: number = targetCoords.top - document.getElementsByClassName("header-content")[0].getBoundingClientRect().height - 12;

        setTimeout(() => {
            this.setState({isMenuPopUpOpen: true});
            this.props.showMessageModal({
                name: `file-${this.props.message.get("id") || this.props.message.get("messageId")}`,
                coords: {top, left},
                callbacks: {
                    handleMessageDelete: this.handleMessageDelete,
                    handleShowInFolder: this.handleShowInFolder,
                    handleMenuPopUpClose: this.handelMenuPopUpClose,
                },
            });
        });
    };

    handelMenuPopUpClose = () => {
        this.setState({isMenuPopUpOpen: false});
        this.props.hideMessageModal();
    };

    componentWillUnmount() {
        const {message} = this.props;
        document.removeEventListener("messageSearch", this.handleMessageEvent);
        document.removeEventListener(message.get("id") || message.get("messageId"), this.handleFileUpload);
        this.mounted = false;
    }

    handleFileUpload = async ({detail: {progress, blob, loadStatus}}) => {
        const {deleteMessage, resetConversationLastMessage, message} = this.props;
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
            obj["uploadStarted"] = true;
        }

        if (loadStatus) {
            obj["loadCancelled"] = true;
            const {updateMessageProperty} = this.props;

            updateMessageProperty(msgId, "loadStatus", loadStatus);
            // if (loadStatus === LOAD_STATUS.UPLOAD_CANCEL) {
            //     Log.i("handleFileUpload -> 4.1 ", loadStatus)
            //     deleteMessage(msgId);
            //     resetConversationLastMessage(message.get("threadId"));
            // } else {
            //     Log.i("handleFileUpload -> 4.2 ", loadStatus)
            //     updateMessageProperty(msgId, "loadStatus", loadStatus);
            // }
        } else {
            obj["loadCancelled"] = false;
        }

        if (this.mounted) {
            this.setState(obj);
        }
    };

    startLoadProcess = async (loadStarted?: any) => {
        const {message, createMessage, downloadFile, uploadFile, fromSharedMedia} = this.props;
        const {loadCancelled, _file, uploadStarted, meta} = this.state;
        const msgId = message.get("id") || message.get("messageId");
        const loadStatus = message.get("loadStatus");
        let uploadedFileDeleted = false;

        if ((!message.get("file") && !_file) || message.get("IsTransferred")) {
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
                const audioUrl = getBlobUri(message.get("file"));
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
        const {message} = this.props;
        const {highlightText} = this.state;
        const msgId: string = message.get("id") || message.get("messageId");

        if (messageIds.includes(msgId) && text) {
            this.setState({highlightText: text});
        } else if (highlightText) {
            this.setState({highlightText: ""})
        }
    };

    handleShowInFolder = async (event, showInFolder: boolean = false) => {
        event && event.stopPropagation();
        const {message, downloadFile} = this.props;
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

    handleMessageDelete = (): void => {
        const {message, handleMessageDelete} = this.props;
        handleMessageDelete(message)
    };

    handleMouseOver = (event: React.MouseEvent<HTMLButtonElement>) => {
        const buttonType: string = event.currentTarget.getAttribute("data-buttonType");
        const localization: any = components().chatPanel;
        let tooltipText: string = "";

        switch (buttonType) {
            case "reply":
                tooltipText = localization.reply;
                break;
            case "more":
                tooltipText = localization.more;
                break;
            case "forward":
                tooltipText = localization.forward;
                break;
            case "moreee":
                tooltipText = localization.more;
                break;
        }
        this.setState({isTooltip: true, tooltipText})
    };

    handleMouseOut = () => {
        this.setState({isTooltip: false, tooltipText: ""})
    };

    get popup(): JSX.Element {
        const {showErrorPopup} = this.state;
        const localizationNotification: any = components().notification;
        return (
            <ReactCSSTransitionGroup
                transitionName={{
                    enter: 'open',
                    leave: 'close',
                }}
                component="div"
                transitionEnter={true}
                transitionLeave={true}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={230}>
                {
                    showErrorPopup &&
                    <PopUpMain
                        confirmButton={this.deleteMessage}
                        cancelButton={this.deleteMessage}
                        confirmButtonText={localizationNotification.close}
                        titleText={localizationNotification.problemTitle}
                        infoText={localizationNotification.fileWasDeleted}
                        showPopUpLogo={true}
                    />
                }
            </ReactCSSTransitionGroup>
        );
    }

    render() {
        const {
            stopProcess,
            searchedActiveMessage,
            message,
            handleShowInFolder,
            forwardMessage,
            handleMessageReply,
            isOnline
        } = this.props;
        const {
            showLoader,
            progress,
            _file,
            loadCancelled,
            uploadStarted,
            highlightText,
            isPlaying,
            meta,
            isTooltip,
            tooltipText,
            isMenuPopUpOpen,
        } = this.state;

        const fileBlob = message.get("file") || _file;
        const msgId = message.get("messageId") || message.get("id");
        const info: any = message.get("info");
        const percent = progress || message.get('percentage');
        const isLoading = showLoader;

        const fileMessage: any = JSON.parse(info);
        const localization: any = components().chatPanel;
        const tooltipLocalization: any = components().tooltip;

        const details: any = {
            fileName: fileMessage.fileName + "." + fileMessage.fileType,
            fileSize: message.get("fileSize") || fileMessage.fileSize,
            fileType: fileMessage.fileType,
            fileLink: message.get("fileLink")
        };

        const fileClass: string = getFileColor(details.fileType);
        const fileType = fileMessage.fileType;
        const isMusicFile: boolean = MUSIC_EXT_LIST.includes(fileType);
        const isStream = isMusicFile && fileBlob && fileBlob.size > 0;
        const duration = meta && meta.duration && meta.duration > 0 && Math.ceil(meta.duration);

        let fileUrl: string = this.blobUri;

        if (fileBlob && !this.blobUri) {
            fileUrl = getBlobUri(fileBlob);
            this.blobUri = fileUrl;
        }

        const downloadFile = async (e) => {
            e.preventDefault();
            if (!isLoading) {
                downloadFromUrlWithName(details.fileName, this.blobUri, msgId)
            }
        };

        const imageSrc: string = getFileIcon(fileType);
        let imageText: string = "";
        if (imageSrc === file_unknown) {
            if (details.fileType.length <= 3) {
                imageText = details.fileType.toUpperCase();
            } else {
                imageText = "FILE";
            }
        }

        let filteredText = details.fileName;
        if (highlightText) {
            const highlightTextArr = filteredText.match(new RegExp(`${highlightText}`, "gi"));
            if (highlightTextArr && highlightTextArr.length > 0) {
                filteredText = filteredText.replace(/<[^>]*>/g, '').replace(new RegExp(`${highlightText}`, "gi"), match => {
                    return `<span draggable="false" class=${searchedActiveMessage === msgId ? "highlight-active text" : "highlight text"}>${match}</span>`;
                });
            }
        }

        const own: boolean = message.get("own");
        const status: boolean = message.get("status");
        const delivered: boolean = message.get("delivered");
        const seen: boolean = message.get("seen");
        const edited: boolean = !!message.get("edited");
        const messageTime: any = message.get("time");

        const isDeliveryWaiting: boolean = own && !status && !delivered && !seen;
        const isSent = own && status && !delivered && !seen;
        const isDelivered = own && delivered && !seen;
        const isSeen = own && seen;
        const time: string = getMessageTime(messageTime);
        const loadStatus: number = message.get("loadStatus");

        Log.i("FileMessage -> isOnline = ", isOnline)

        return (
            <>
                <FileBlock className={this.props.language === "ar" ? "file-block file-block-ar" : "file-block"}>
                    <FileContent
                        className="file"
                        onClick={message.get("type") === MESSAGE_TYPES.file && (window as any).isDesktop ? handleShowInFolder : null}
                    >
                        {
                            isLoading ?
                                <div className={`bg-circle ${fileClass}`}>
                                    <div className="ko-progress-circle" data-progress={percent}>
                                        <div className="ko-circle">
                                            <div className="full ko-progress-circle__slice">
                                                <div className="ko-progress-circle__fill"/>
                                            </div>
                                            <div className="ko-progress-circle__slice">
                                                <div className="ko-progress-circle__fill"/>
                                                <div className="ko-progress-circle__fill ko-progress-circle__bar"/>
                                            </div>
                                        </div>
                                        <div className={`ko-progress-circle__overlay ${fileClass}`}/>
                                    </div>
                                    <button
                                        onClick={!loadCancelled ? (() => {return stopProcess(loadStatus === LOAD_STATUS.DOWNLOAD_CANCEL || loadStatus === LOAD_STATUS.DOWNLOAD_FAILURE ? false : uploadStarted)}) : this.startLoadProcess}
                                        className={(showLoader && uploadStarted) || (!isOnline) ? (loadCancelled ? "resend-icon" : "cancel-icon") : (loadCancelled ? "download-icon" : "cancel-icon")}/>
                                </div>
                                :
                                <>
                                    <MessageIcon
                                        isChatFileMessage={true}
                                        isMusicFileMessage={isMusicFile}
                                        background={isMusicFile ? "rgb(22,172,246)" : "none"}
                                        borderRadius={isMusicFile ? "50%" : "0"}
                                    >
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
                                    {
                                        isMusicFile &&
                                        <MessageInfo display={"none"}>
                                            {isStream ?
                                                <audio onEnded={this.handleAudioEnd}
                                                       onTimeUpdate={this.handleTimeUpdate}
                                                       onPause={this.handleAudioPause}
                                                       ref={this.handleAudioRef}
                                                       preload="auto"
                                                       controls={true}
                                                       className="audio"
                                                >
                                                    <source src={fileUrl} type="audio/mpeg"/>
                                                </audio> : ""}
                                        </MessageInfo>
                                    }
                                </>
                        }
                        <FileTextBlock language={this.props.language} >
                            {highlightText ?
                                <FileName
                                    language={this.props.language}
                                    href={this.blobUri}
                                    onClick={(window as any).isDesktop ? this.handleShowInFolder : downloadFile}
                                    dangerouslySetInnerHTML={{__html: filteredText}}
                                /> :
                                <FileName
                                  language={this.props.language}
                                    href={this.blobUri}
                                    onClick={(window as any).isDesktop ? this.handleShowInFolder : downloadFile}>{filteredText}
                                </FileName>
                            }
                            <FileSize language={this.props.language}>{isMusicFile ? (duration ? format(duration * 1000, "mm:ss") : "00:00") : handleFileSize(details.fileSize)}
                                {(window as any).fs && !showLoader && !isTooltip &&

                                <Link
                                    onClick={(event) => this.handleShowInFolder(event, true)}>{localization.downloadFile}</Link>
                                }

                                {
                                    isTooltip &&
                                    <ButtonText>{tooltipText}</ButtonText>
                                }
                            </FileSize>

                        </FileTextBlock>

                    </FileContent>

                    <TimeBubble
                      language={this.props.language}
                        isOwnMessage={own}
                    >
                        {edited && <EditedMessage/>}
                        <Time>{time}</Time>
                        <StatusMessage
                            isSeen={isSeen}
                            isDelivered={isDelivered}
                            isSent={isSent}/>
                        {isDeliveryWaiting &&
                        <IsDeliveryWaiting><span/></IsDeliveryWaiting>}
                    </TimeBubble>

                    {this.popup}

                </FileBlock>
                <TooltipContent id={""} fileBubble={true} isMenuPopUpOpen={isMenuPopUpOpen} language={this.props.language}>
                    {loadCancelled ?
                        <>
                            <TooltipText content={tooltipLocalization.reply}>
                                <TooltipButton
                                    fileBubble={true} reply={true}
                                    onClick={() => handleMessageReply(false, message)}/>
                            </TooltipText>
                            <TooltipText content={tooltipLocalization.deleteMessage}>
                                <TooltipButton
                                    fileBubble={true}
                                    delete={true}
                                    onClick={this.handleMessageDelete}/>
                            </TooltipText>

                        </>
                        :
                        <>
                            <TooltipText content={tooltipLocalization.reply}>
                                <TooltipButton
                                    onMouseOver={this.handleMouseOver}
                                    onMouseOut={this.handleMouseOut}
                                    fileBubble={true}
                                    reply={true}
                                    onClick={() => handleMessageReply(false, message)}
                                    data-buttonType="reply"
                                />
                            </TooltipText>
                            <TooltipText content={tooltipLocalization.forward}>
                                <TooltipButton
                                    onMouseOver={this.handleMouseOver}
                                    onMouseOut={this.handleMouseOut}
                                    fileBubble={true}
                                    forward={true}
                                    onClick={() => forwardMessage(message)}
                                    data-buttonType="forward"
                                />
                            </TooltipText>
                            <TooltipText content={tooltipLocalization.more}>
                                <TooltipButton
                                    onMouseOver={this.handleMouseOver}
                                    onMouseOut={this.handleMouseOut}
                                    fileBubble={true}
                                    more={true}
                                    onClick={isMenuPopUpOpen ? this.handelMenuPopUpClose : this.handelMenuPopUpOpen}
                                    data-buttonType="more"
                                />
                            </TooltipText>
                        </>
                    }
                </TooltipContent>
            </>
        );
    }
}

const mapDispatchToProps: any = (dispatch) => ({
    showMessageModal: (modalData: object) => dispatch(showMessageModal(modalData)),
    hideMessageModal: () => dispatch(hideMessageModal()),
});

export default connect<{}, {}, IFileMessageProps>(null, mapDispatchToProps)(FileMessage);
